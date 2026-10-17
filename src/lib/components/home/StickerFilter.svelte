<script lang="ts">
	/**
	 * Filters the home page's ranked sections by a sticker. Hidden when the
	 * catalogue has no active stickers.
	 */
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import StickerImage from '$lib/components/stickers/StickerImage.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { findSticker } from '$lib/utils/stickers'
	import type { Sticker } from '$lib/types/api/sticker'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		stickers: Sticker[]
		value: string | null
		onChange: (slug: string | null) => void
	}

	let { stickers, value, onChange }: Props = $props()

	const selected = $derived(findSticker(stickers, value))
</script>

{#if stickers.length > 0}
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button
				{...props}
				variant="secondary"
				size="small"
				shape="pill"
				rightIcon="chevron-down"
				aria-label={m.home_sticker_filter_aria()}
				class="sticker-filter-trigger"
			>
				<span class="trigger-content">
					{#if selected}
						<StickerImage sticker={selected} size={20} plain />
						<span class="trigger-label">{localizedName(selected.meaning)}</span>
					{:else}
						<span class="trigger-label">{m.home_sticker_any()}</span>
					{/if}
				</span>
			</Button>
		{/snippet}
		{#snippet menu()}
			<DropdownItem class={value ? '' : 'selected'} onSelect={() => onChange(null)}>
				{m.home_sticker_any()}
			</DropdownItem>
			{#each stickers as sticker (sticker.id)}
				<DropdownItem
					class={sticker.slug === value ? 'selected' : ''}
					onSelect={() => onChange(sticker.slug)}
				>
					<span class="option">
						<StickerImage {sticker} size={20} plain />
						<span>{localizedName(sticker.meaning)}</span>
					</span>
				</DropdownItem>
			{/each}
		{/snippet}
	</DropdownMenu>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	:global(.sticker-filter-trigger) {
		background: var(--card-bg) !important;
	}

	:global(.dropdown-item.selected) {
		background: var(--button-bg);
	}

	.trigger-content,
	.option {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
		min-width: 0;
	}

	.trigger-label {
		max-width: 240px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
