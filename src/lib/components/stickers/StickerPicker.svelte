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
	import { cubicOut } from 'svelte/easing'
	import { DropdownMenu } from 'bits-ui'
	import { createQuery } from '@tanstack/svelte-query'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import Button from '$lib/components/ui/Button.svelte'
	import StickerImage, { STICKER_EFFECTS } from './StickerImage.svelte'
	import { STICKER_SIZE } from '$lib/utils/stickerLayout'
	import { prefersReducedMotion } from '$lib/utils/motion'
	import StickerRemoveButton from './StickerRemoveButton.svelte'
	import { GHOST_SCALE, GHOST_SCALE_OVER_ZONE } from './stickerDrag.svelte'
	import { useStickerStage } from './stickerStage.svelte'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { useStickerActions } from '$lib/composables/sticker-actions.svelte'
	import { canShowStickerPicker, pickerStickers } from '$lib/utils/stickers'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
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

	// A 3×3 grid per page, with dots and arrows under it to move between them
	const PAGE_SIZE = 9
	const pageCount = $derived(Math.max(1, Math.ceil(stickers.length / PAGE_SIZE)))
	let pageIndex = $state(0)
	const pageStickers = $derived(stickers.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE))

	// Which way the pages slide: 1 to the next page, -1 to the previous
	let direction = $state(1)
	// Clipped only mid-slide, so the stickers' shadows aren't cut off at rest
	let sliding = $state(false)

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

	function goToPage(index: number) {
		const next = Math.min(Math.max(index, 0), pageCount - 1)
		if (next === pageIndex) return
		direction = next > pageIndex ? 1 : -1
		sliding = true
		pageIndex = next
	}

	// The page slides out one way as the next slides in from the other
	function slide(node: Element, { from }: { from: 1 | -1 }) {
		return {
			duration: prefersReducedMotion() ? 0 : 240,
			easing: cubicOut,
			css: (t: number) => `transform: translateX(${(1 - t) * from * 100}%)`
		}
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
				<Button {...props} variant="secondary" size="small" disabled={busy}>
					{m.sticker_add()}
				</Button>
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
					<div class="sign-in">
						<p>{m.sticker_sign_in_prompt()}</p>
						<div class="sign-in-actions">
							<Button
								variant="primary"
								size="small"
								onclick={() => goto(localizeHref('/auth/register'))}
							>
								{m.sticker_sign_up()}
							</Button>
							<Button
								variant="secondary"
								size="small"
								onclick={() => goto(localizeHref('/auth/login'))}
							>
								{m.sticker_log_in()}
							</Button>
						</div>
					</div>
				{:else if stickersQuery.isLoading}
					<p class="status">{m.sticker_picker_loading()}</p>
				{:else if stickers.length === 0}
					<p class="status">{m.sticker_picker_empty()}</p>
				{:else}
					<div class="pages" class:sliding>
						{#key pageIndex}
							<div
								class="sticker-grid"
								in:slide={{ from: direction === 1 ? 1 : -1 }}
								out:slide={{ from: direction === 1 ? -1 : 1 }}
								onintroend={() => (sliding = false)}
							>
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
						{/key}
					</div>
					{#if pageCount > 1}
						<div class="pager">
							<Button
								variant="ghost"
								size="small"
								iconOnly
								icon="chevron-left"
								aria-label={m.sticker_page_previous()}
								disabled={pageIndex === 0}
								onclick={() => goToPage(pageIndex - 1)}
							/>
							<div class="dots">
								{#each { length: pageCount }, index (index)}
									<button
										type="button"
										class="dot"
										class:active={index === pageIndex}
										aria-label={m.sticker_page({ page: index + 1, count: pageCount })}
										aria-current={index === pageIndex ? 'page' : undefined}
										onclick={() => goToPage(index)}
									></button>
								{/each}
							</div>
							<Button
								variant="ghost"
								size="small"
								iconOnly
								icon="chevron-right"
								aria-label={m.sticker_page_next()}
								disabled={pageIndex === pageCount - 1}
								onclick={() => goToPage(pageIndex + 1)}
							/>
						</div>
					{/if}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<!-- The sticker following the pointer while it's dragged out of the menu -->
{#if stage.drag.sticker}
	<div
		class="drag-ghost"
		style:left="{stage.drag.x}px"
		style:top="{stage.drag.y}px"
		style:--ghost-tilt="{stage.drag.tilt}deg"
		style:--ghost-scale={stage.drag.overZone ? GHOST_SCALE_OVER_ZONE : GHOST_SCALE}
		aria-hidden="true"
	>
		<!-- At the team page's size, the size it lands at -->
		<StickerImage
			sticker={stage.drag.sticker}
			size={STICKER_SIZE}
			effects={STICKER_EFFECTS.ghost}
		/>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	// Stickers carry the game's own captions, so they need room to be read
	:global(.sticker-picker) {
		max-width: none;
	}

	// Pages stack in one cell while one slides out and the next slides in
	.pages {
		display: grid;

		&.sliding {
			overflow: hidden;
		}

		> * {
			grid-area: 1 / 1;
		}
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

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit spacing.$unit-half spacing.$unit-half;
	}

	.dots {
		display: flex;
		gap: spacing.$unit-half;
	}

	// Small dots with a larger target around them
	.dot {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;

		&::before {
			content: '';
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--text-tertiary);
			opacity: 0.5;
			transition:
				opacity 0.15s ease,
				background-color 0.15s ease;
		}

		&:hover::before {
			opacity: 1;
		}

		&.active::before {
			background: var(--text-primary);
			opacity: 1;
		}

		@media (prefers-reduced-motion: reduce) {
			&::before {
				transition: none;
			}
		}
	}

	// Leans with the drag (stage.drag.tilt); only the scale eases, since the
	// lean is already smoothed frame by frame
	.drag-ghost {
		position: fixed;
		z-index: 1000;
		pointer-events: none;
		transform: translate(-50%, -50%) rotate(var(--ghost-tilt, 0deg));
		scale: var(--ghost-scale, 1);
		transition: scale 0.12s ease;
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

	.sign-in {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.sign-in-actions {
		display: flex;
		gap: spacing.$unit;
	}
</style>
