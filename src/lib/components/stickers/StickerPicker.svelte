<script lang="ts">
	/**
	 * Give a team a sticker. Picking one gives it, and picking another swaps
	 * it; picking the one you gave just closes the menu, and its (x) takes it
	 * back. Hidden on the viewer's own team and on teams that can't receive
	 * stickers. Signed-out viewers get the Sign up / Log in prompt instead of
	 * the stickers. Stickers can also be dragged out of the menu into the
	 * team's sticker area.
	 */
	import { untrack } from 'svelte'
	import { DropdownMenu } from 'bits-ui'
	import { createQuery } from '@tanstack/svelte-query'
	import { page } from '$app/stores'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import SlidingPages from '$lib/components/ui/SlidingPages.svelte'
	import StickerImage, { STICKER_EFFECTS } from './StickerImage.svelte'
	import StickerRemoveButton from './StickerRemoveButton.svelte'
	import StickerSignInPrompt from './StickerSignInPrompt.svelte'
	import { GHOST_SCALE } from './stickerDrag.svelte'
	import { useStickerStage } from './stickerStage.svelte'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { useStickerActions } from '$lib/composables/sticker-actions.svelte'
	import { canShowStickerPicker, pickerStickers } from '$lib/utils/stickers'
	import { localizedName } from '$lib/utils/locale'
	import type { Party, StickerPlacement } from '$lib/types/api/party'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		party: Pick<Party, 'id' | 'shortcode' | 'user' | 'visibility' | 'mySticker'>
		align?: 'start' | 'end'
	}

	let { party, align = 'end' }: Props = $props()

	const viewerId = $derived(($page.data?.account?.userId as string | undefined) ?? null)
	const isAuthenticated = $derived(Boolean($page.data?.isAuthenticated))
	const visible = $derived(canShowStickerPicker(party, viewerId))

	const stage = useStickerStage()
	let open = $state(false)
	let menu = $state<HTMLElement | null>(null)

	const stickersQuery = createQuery(() => ({
		...stickerQueries.active(),
		enabled: visible
	}))
	const current = $derived(party.mySticker ?? null)
	// The viewer's sticker comes first, so it's on the page the menu opens on
	const stickers = $derived.by(() => {
		const all = pickerStickers(stickersQuery.data)
		const mine = all.find((sticker) => sticker.slug === current)
		return mine ? [mine, ...all.filter((sticker) => sticker !== mine)] : all
	})

	// A 3×3 grid per page, opening on the first
	const PAGE_SIZE = 9
	let pageIndex = $state(0)
	const pageLabels = {
		previous: m.sticker_page_previous(),
		next: m.sticker_page_next(),
		page: (page: number, count: number) => m.sticker_page({ page, count })
	}

	$effect(() => {
		if (open) pageIndex = 0
	})

	// The sticker area asked for the menu, by where it was clicked
	$effect(() => {
		if (!stage.request.pending) return
		stage.takePickerRequest()
		open = true
	})
	$effect(() => {
		if (!open) untrack(() => stage.clearPickerRequest())
	})
	// Opened from a click in the area, the menu would focus its first button
	// (the (x), or a page dot) and ring it; focus the menu itself instead
	function focusMenu(event: Event) {
		if (!stage.request.anchor) return
		event.preventDefault()
		menu?.focus({ preventScroll: true })
	}

	const actions = stage.actions ?? useStickerActions({ getParty: () => party })
	const busy = $derived(actions.busy)

	// A sticker dropped in the sticker area is given (or
	// moved, if it's already yours) with where it was dropped
	function dropSticker(slug: string, placement: StickerPlacement): Promise<boolean> {
		return actions.give(slug, placement)
	}

	// Picked with a spot in the sticker area waiting for it (it was clicked
	// there): the sticker lands there, as if dropped. Otherwise as usual.
	function choose(slug: string) {
		const { anchor, placement } = stage.request
		if (!anchor || !placement) return pick(slug)
		const rect = anchor.getBoundingClientRect()
		return stage.dropInZone(
			slug,
			placement,
			{
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
				tilt: 0,
				scale: GHOST_SCALE
			},
			dropSticker
		)
	}

	// The (x) on the viewer's sticker
	function takeBack() {
		open = false
		void actions.remove()
	}

	function pick(slug: string): Promise<boolean> {
		if (slug === current) return Promise.resolve(true)
		return actions.give(slug)
	}
</script>

{#if visible}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Tooltip content={m.sticker_add()}>
					<Button
						{...props}
						variant="ghost"
						size="small"
						iconOnly
						icon="sticker"
						aria-label={m.sticker_add()}
						disabled={busy}
					/>
				</Tooltip>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content
				class="dropdown-menu sticker-picker"
				sideOffset={6}
				align={stage.request.anchor ? 'center' : align}
				customAnchor={stage.request.anchor}
				bind:ref={menu}
				onOpenAutoFocus={focusMenu}
				aria-label={m.sticker_picker_title()}
			>
				{#if !isAuthenticated}
					<StickerSignInPrompt />
				{:else if stickersQuery.isLoading}
					<p class="status">{m.sticker_picker_loading()}</p>
				{:else if stickers.length === 0}
					<p class="status">{m.sticker_picker_empty()}</p>
				{:else}
					<SlidingPages
						items={stickers}
						pageSize={PAGE_SIZE}
						bind:index={pageIndex}
						labels={pageLabels}
					>
						{#snippet page(pageStickers)}
							<div class="sticker-grid">
								{#each pageStickers as sticker (sticker.id)}
									{@const meaning = localizedName(sticker.meaning)}
									<div class="option">
										<DropdownMenu.Item
											class="sticker-option {sticker.slug === current ? 'selected' : ''}"
											aria-label={meaning}
											aria-current={sticker.slug === current ? 'true' : undefined}
											onSelect={() => choose(sticker.slug)}
											onpointerdown={(e: PointerEvent) =>
												stage.pressSticker(e, sticker, {
													onDragStart: () => (open = false),
													onDrop: dropSticker
												})}
										>
											<StickerImage {sticker} size={64} effects={STICKER_EFFECTS.picker} />
										</DropdownMenu.Item>
										{#if sticker.slug === current}
											<StickerRemoveButton onclick={takeBack} />
										{/if}
									</div>
								{/each}
							</div>
						{/snippet}
					</SlidingPages>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	// Stickers carry the game's own captions, so they need room to be read
	:global(.sticker-picker) {
		max-width: none;
	}

	.option {
		position: relative;
	}

	.sticker-grid {
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
	}

	// Hovered and keyboard-highlighted stickers lift and shine (StickerImage)
	:global(.sticker-option) {
		touch-action: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		cursor: pointer;
		outline: 2px solid transparent;

		&:global(.selected) {
			outline-color: var(--accent-blue);
		}
	}

	// Softer than the sticker area's shadow while resting, since the stickers
	// sit packed together here; hovering still lifts them with the full one
	:global(.sticker-option:not([data-highlighted]) > .sticker.shadow:not(:hover)) {
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
	}

	.status {
		margin: 0;
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
