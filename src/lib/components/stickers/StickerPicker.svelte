<script lang="ts">
	/**
	 * Give a team a sticker. Picking one gives it, picking it again removes it,
	 * and picking another swaps it. Hidden on the viewer's own team and on
	 * teams that can't receive stickers. Signed-out viewers get the Sign up /
	 * Log in prompt instead of the stickers.
	 */
	import { DropdownMenu } from 'bits-ui'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import FavoriteToast from '$lib/components/ui/FavoriteToast.svelte'
	import StickerImage from './StickerImage.svelte'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { useGiveSticker, useRemoveSticker } from '$lib/api/mutations/sticker.mutations'
	import {
		canShowStickerPicker,
		findSticker,
		nextStickerAction,
		pickerStickers,
		type StickerAction
	} from '$lib/utils/stickers'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { Party } from '$lib/types/api/party'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		party: Pick<Party, 'id' | 'shortcode' | 'name' | 'user' | 'visibility' | 'mySticker'>
		align?: 'start' | 'end'
	}

	let { party, align = 'end' }: Props = $props()

	const viewerId = $derived(($page.data?.account?.userId as string | undefined) ?? null)
	const isAuthenticated = $derived(Boolean($page.data?.isAuthenticated))
	const visible = $derived(canShowStickerPicker(party, viewerId))

	let open = $state(false)

	const stickersQuery = createQuery(() => ({
		...stickerQueries.active(),
		enabled: visible
	}))
	const stickers = $derived(pickerStickers(stickersQuery.data))
	const current = $derived(party.mySticker ?? null)
	const currentSticker = $derived(findSticker(stickersQuery.data, current))

	const giveMut = useGiveSticker()
	const removeMut = useRemoveSticker()
	const busy = $derived(giveMut.isPending || removeMut.isPending)

	function toastFor(action: StickerAction, meaning: string): string {
		const name = party.name || m.party_untitled()
		if (action.type === 'remove') return m.sticker_toast_removed({ name })
		if (action.type === 'swap') return m.sticker_toast_changed({ name, meaning })
		return m.sticker_toast_given({ name, meaning })
	}

	async function pick(slug: string) {
		if (busy) return
		const action = nextStickerAction(current, slug)
		const meaning = localizedName(findSticker(stickersQuery.data, slug)?.meaning)
		const params = { id: party.id, shortcode: party.shortcode }

		try {
			if (action.type === 'remove') await removeMut.mutateAsync(params)
			else await giveMut.mutateAsync({ ...params, slug })

			const partyName = party.name || m.party_untitled()
			toast.custom(FavoriteToast, {
				componentProps: { partyName, message: toastFor(action, meaning), icon: 'sticker' }
			})
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.sticker_toast_failed()))
		}
	}
</script>

{#if visible}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="small"
					iconOnly
					icon={currentSticker ? undefined : 'sticker'}
					aria-label={currentSticker
						? m.sticker_picker_current({ meaning: localizedName(currentSticker.meaning) })
						: m.sticker_picker_open()}
					disabled={busy}
				>
					{#if currentSticker}
						<StickerImage sticker={currentSticker} size={18} plain />
					{/if}
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content class="dropdown-menu sticker-picker" sideOffset={6} {align}>
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
					<p class="title">{m.sticker_picker_title()}</p>
					<div class="sticker-grid">
						{#each stickers as sticker (sticker.id)}
							{@const meaning = localizedName(sticker.meaning)}
							<DropdownMenu.Item
								class="sticker-option {sticker.slug === current ? 'selected' : ''}"
								aria-label={meaning}
								aria-current={sticker.slug === current ? 'true' : undefined}
								onSelect={() => pick(sticker.slug)}
							>
								<Tooltip content={meaning}>
									<StickerImage {sticker} size={40} plain />
								</Tooltip>
							</DropdownMenu.Item>
						{/each}
					</div>
					{#if current}
						<p class="hint">{m.sticker_picker_hint_remove()}</p>
					{/if}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	:global(.sticker-picker) {
		max-width: calc(spacing.$unit * 40);
	}

	.title {
		margin: 0;
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.sticker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
	}

	:global(.sticker-option) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		cursor: pointer;
		outline: 2px solid transparent;

		&:global([data-highlighted]) {
			background: var(--button-bg);
		}

		&:global(.selected) {
			outline-color: var(--accent-blue);
		}
	}

	.status,
	.hint {
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
