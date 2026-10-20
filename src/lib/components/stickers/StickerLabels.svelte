<script lang="ts">
	/**
	 * The stickers a team is known for, with no counts. The viewer's own
	 * sticker gets a ring when it's one of them. Slugs missing from the
	 * catalogue (retired stickers) aren't shown.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { findSticker } from '$lib/utils/stickers'
	import StickerImage, { type StickerEffect } from './StickerImage.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		labels?: string[] | undefined
		mySticker?: string | null | undefined
		size?: number
		effects?: StickerEffect[]
	}

	let { labels, mySticker, size = 20, effects = [] }: Props = $props()

	const slugs = $derived(labels ?? [])
	const stickersQuery = createQuery(() => ({
		...stickerQueries.active(),
		enabled: slugs.length > 0
	}))

	const shown = $derived(
		slugs
			.map((slug) => ({ slug, sticker: findSticker(stickersQuery.data, slug) }))
			.filter((entry) => entry.sticker)
	)
</script>

{#if shown.length > 0}
	<span
		class="sticker-labels"
		style:--labels-size="{size}px"
		role="list"
		aria-label={m.sticker_labels_aria()}
	>
		{#each shown as entry (entry.slug)}
			<span role="listitem">
				<StickerImage
					sticker={entry.sticker}
					{size}
					highlighted={entry.slug === mySticker}
					{effects}
				/>
			</span>
		{/each}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.sticker-labels {
		display: inline-flex;
		align-items: center;
		// A long team name truncates before the stickers do
		flex-shrink: 0;
		// Wider for large stickers, so tilted ones don't touch
		gap: max(spacing.$unit-half, calc(var(--labels-size) / 6));
	}

	// No line box around each sticker, so the row is only as tall as they are
	[role='listitem'] {
		display: flex;
	}
</style>
