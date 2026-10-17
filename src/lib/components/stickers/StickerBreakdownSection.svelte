<script lang="ts">
	/**
	 * The owner's private view of the stickers their team received, with a
	 * count for each. Nobody else gets this data, and givers stay anonymous.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import StickerImage from './StickerImage.svelte'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { findSticker } from '$lib/utils/stickers'
	import { localizedName } from '$lib/utils/locale'
	import type { StickerBreakdownEntry } from '$lib/types/api/sticker'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		breakdown: StickerBreakdownEntry[]
	}

	let { breakdown }: Props = $props()

	const stickersQuery = createQuery(() => stickerQueries.active())

	const rows = $derived(
		breakdown
			.toSorted((a, b) => b.count - a.count)
			.map((entry) => ({ ...entry, sticker: findSticker(stickersQuery.data, entry.sticker) }))
	)
</script>

<DetailsSection
	title={m.sticker_breakdown_title()}
	empty={rows.length === 0}
	emptyMessage={m.sticker_breakdown_empty()}
>
	{#each rows as row (row.sticker?.id ?? row.sticker)}
		<DetailRow value={row.count}>
			{#snippet labelSlot()}
				<span class="sticker-row">
					<StickerImage sticker={row.sticker} slug={row.sticker?.slug ?? ''} size={24} plain />
					<span>{row.sticker ? localizedName(row.sticker.meaning) : m.sticker_retired()}</span>
				</span>
			{/snippet}
		</DetailRow>
	{/each}
	{#snippet description()}
		<p class="note">{m.sticker_breakdown_private()}</p>
	{/snippet}
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.sticker-row {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.note {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
