<script lang="ts">
	/**
	 * The game's own stickers, to make a sticker from instead of uploading
	 * images: filter by section, search the captions, and pick one. Stickers
	 * the catalogue already has are marked.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import Input from '$lib/components/ui/Input.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import SlidingPages from '$lib/components/ui/SlidingPages.svelte'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { getHostedImageUrl } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import { stickerImageUrl } from '$lib/utils/stickers'
	import * as m from '$lib/paraglide/messages'
	import type { LibrarySticker } from '$lib/types/api/sticker'

	interface Props {
		/** The library sticker picked */
		selected?: number | null
		/** The sticker being edited: until another is picked, the library
		 * sticker it was made from shows as picked */
		stickerId?: string | undefined
		onSelect: (entry: LibrarySticker) => void
	}

	let { selected = null, stickerId, onSelect }: Props = $props()

	const libraryQuery = createQuery(() => stickerQueries.library())

	const picked = $derived(
		selected ?? libraryQuery.data?.find((entry) => stickerId && entry.stickerId === stickerId)?.id
	)

	const ALL = 'all'
	const SECTION_LABELS: Record<string, () => string> = {
		'Standard Stickers': m.db_stickers_library_standard,
		'Event Stickers': m.db_stickers_library_event,
		'Rupie Stickers': m.db_stickers_library_rupie,
		'Promotional Stickers': m.db_stickers_library_promotional
	}

	let section = $state(ALL)
	let search = $state('')

	// A 10×4 grid per page, back to the first when the filter changes
	const PAGE_SIZE = 40
	let pageIndex = $state(0)
	const pageLabels = {
		previous: m.sticker_page_previous(),
		next: m.sticker_page_next(),
		page: (page: number, count: number) => m.sticker_page({ page, count })
	}

	$effect(() => {
		void section
		void search
		pageIndex = 0
	})

	// In the wiki's order, then any others
	const sections = $derived.by(() => {
		const present = new Set((libraryQuery.data ?? []).map((entry) => entry.section))
		const known = Object.keys(SECTION_LABELS)
		return [
			...known.filter((name) => present.has(name)),
			...[...present].filter((name) => !known.includes(name))
		]
	})
	const shown = $derived.by(() => {
		const query = search.trim().toLowerCase()
		return (libraryQuery.data ?? []).filter(
			(entry) =>
				(section === ALL || entry.section === section) &&
				(!query || entry.label.toLowerCase().includes(query))
		)
	})
</script>

<div class="library">
	<div class="controls">
		<SegmentedControl bind:value={section} size="xsmall" variant="background">
			<Segment value={ALL}>{m.db_stickers_library_all()}</Segment>
			{#each sections as name (name)}
				<Segment value={name}>{SECTION_LABELS[name]?.() ?? name}</Segment>
			{/each}
		</SegmentedControl>
		<Input
			bind:value={search}
			type="search"
			leftIcon="search"
			clearable
			contained
			placeholder={m.db_stickers_library_search()}
		/>
	</div>

	{#if libraryQuery.isLoading}
		<p class="status">{m.db_stickers_library_loading()}</p>
	{:else if shown.length === 0}
		<p class="status">{m.db_stickers_library_empty()}</p>
	{:else}
		<SlidingPages items={shown} pageSize={PAGE_SIZE} bind:index={pageIndex} labels={pageLabels}>
			{#snippet page(entries)}
				<div class="grid">
					{#each entries as entry (entry.id)}
						<button
							type="button"
							class="stamp"
							class:selected={entry.id === picked}
							class:used={!!entry.stickerId}
							title={entry.stickerId
								? `${entry.label} · ${m.db_stickers_library_used()}`
								: entry.label}
							aria-label={entry.label}
							aria-pressed={entry.id === picked}
							onclick={() => onSelect(entry)}
						>
							<img
								src={getHostedImageUrl(stickerImageUrl(entry, appLocale()))}
								alt=""
								width="64"
								height="64"
								loading="lazy"
							/>
						</button>
					{/each}
					<!-- A short last page keeps a full page's height -->
					{#each { length: shown.length > PAGE_SIZE ? PAGE_SIZE - entries.length : 0 }, filler (filler)}
						<span class="stamp filler" aria-hidden="true"><span class="filler-image"></span></span>
					{/each}
				</div>
			{/snippet}
		</SlidingPages>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.library {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: spacing.$unit-half;
	}

	.stamp {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-half;
		border: 2px solid transparent;
		border-radius: layout.$item-corner;
		background: none;
		cursor: pointer;

		&:hover {
			background: var(--button-bg);
		}

		&.selected {
			border-color: var(--accent-blue);
			background: var(--button-bg);
		}

		// Already in the catalogue
		&.used img {
			opacity: 0.4;
		}

		&.filler {
			cursor: default;

			&:hover {
				background: none;
			}
		}

		// Shrinks on narrow screens, so every page keeps its 10×4 shape
		img,
		.filler-image {
			width: 100%;
			max-width: 64px;
			height: auto;
			aspect-ratio: 1;
			object-fit: contain;
		}
	}

	.status {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
