<script lang="ts">
	import type { PageData } from './$types'
	import { untrack } from 'svelte'
	import { createQuery, keepPreviousData } from '@tanstack/svelte-query'
	import { MediaQuery } from 'svelte/reactivity'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import EventSection from '$lib/components/home/EventSection.svelte'
	import StickerFilter from '$lib/components/home/StickerFilter.svelte'
	import { homeQueries } from '$lib/api/queries/home.queries'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { pickerStickers } from '$lib/utils/stickers'
	import { exploreQuery } from '$lib/utils/home'
	import { EXPLORE_PATH, explorePath } from '$lib/utils/browseRoutes'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'

	let { data }: { data: PageData } = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

	// Only the sticker filter lives in the URL. Seeded once from SSR, then
	// changed client-side without navigating.
	const ssrSticker = untrack(() => data.sticker)
	let sticker = $state<string | null>(ssrSticker)

	const stickersQuery = createQuery(() => stickerQueries.active())
	const stickers = $derived(pickerStickers(stickersQuery.data))

	const homeQuery = createQuery(() => {
		const matchesSSR = sticker === ssrSticker && !!data.home
		return {
			...homeQueries.sections(sticker ?? undefined),
			initialData: matchesSSR ? (data.home ?? undefined) : undefined,
			initialDataUpdatedAt: matchesSSR ? Date.now() : undefined,
			placeholderData: keepPreviousData
		}
	})

	const home = $derived(homeQuery.data)
	const refreshing = $derived(homeQuery.isPlaceholderData)
	const loadError = $derived(
		homeQuery.isError
			? (homeQuery.error?.message ?? m.explore_unknown_error())
			: !homeQuery.data && sticker === ssrSticker
				? data.loadError
				: null
	)

	const current = $derived(home?.current ?? [])
	const upcoming = $derived(home?.upcoming ?? [])
	const rising = $derived((home?.rising ?? []).slice(0, 3))
	const staffPicks = $derived(
		(home?.staffPicks ?? [])
			.toSorted((a, b) => a.position - b.position)
			.slice(0, isMobile.current ? 3 : 6)
	)

	const hasRanked = $derived(current.length + upcoming.length + rising.length > 0)
	const isEmpty = $derived(!!home && !hasRanked && staffPicks.length === 0)

	function setSticker(slug: string | null) {
		sticker = slug
		const url = new URL(window.location.href)
		if (slug) url.searchParams.set('sticker', slug)
		else url.searchParams.delete('sticker')
		history.replaceState(history.state, '', `${url.pathname}${url.search}`)
	}

	const risingHref = $derived(
		localizeHref(explorePath(exploreQuery({ sticker, sort: 'participation' })))
	)
</script>

<PageMeta title={m.page_title_gallery()} description={m.page_desc_gallery()} />

<section class="home">
	<div class="toprow">
		<StickerFilter {stickers} value={sticker} onChange={setSticker} />
		<a class="see-all" href={localizeHref(EXPLORE_PATH)}>{m.home_all_teams()} →</a>
	</div>

	{#if loadError && !home}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>{m.explore_load_error({ error: loadError })}</p>
			<Button size="small" onclick={() => homeQuery.refetch()}>{m.retry()}</Button>
		</div>
	{:else if isEmpty && !sticker}
		<EmptyState message={m.home_empty()}>
			<Button size="small" href={localizeHref(EXPLORE_PATH)}>{m.home_browse_all()}</Button>
		</EmptyState>
	{:else if home}
		<div class="sections" class:refreshing>
			{#if current.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>{m.home_now_running()}</h2>
					</div>
					{#each current as entry, i (entry.event.id)}
						<EventSection
							event={entry.event}
							raids={entry.raids}
							variant="current"
							maxCards={i === 0 ? 6 : 3}
							{sticker}
						/>
					{/each}
				</div>
			{/if}

			{#if upcoming.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>{m.home_upcoming()}</h2>
					</div>
					{#each upcoming as entry, i (entry.event.id)}
						<EventSection
							event={entry.event}
							raids={entry.raids}
							variant="upcoming"
							hasPrevious={entry.previousEvent !== null}
							showBanner={current.length === 0 && i === 0}
							{sticker}
						/>
					{/each}
				</div>
			{/if}

			{#if !hasRanked && sticker}
				<EmptyState message={m.home_empty_filtered()}>
					<Button size="small" onclick={() => setSticker(null)}>{m.home_clear_filter()}</Button>
				</EmptyState>
			{/if}

			{#if rising.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>
							{m.home_rising()}<span class="sub">{m.home_rising_sub()}</span>
						</h2>
						<a class="see-all" href={risingHref}>{m.home_see_all()} →</a>
					</div>
					<ExploreGrid items={rising} />
				</div>
			{/if}

			{#if staffPicks.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>{m.home_staff_picks()}</h2>
					</div>
					<ExploreGrid items={staffPicks.map((pick) => pick.party)}>
						{#snippet card(party, index)}
							{@const note = staffPicks[index]?.note}
							{@const noteText = note ? localizedName(note) : ''}
							{#if noteText && noteText !== '—'}
								<GridRep {party}>
									{#snippet footer()}{noteText}{/snippet}
								</GridRep>
							{:else}
								<GridRep {party} />
							{/if}
						{/snippet}
					</ExploreGrid>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.home {
		padding: $unit-2x 0;
	}

	.toprow {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $unit;
		margin-bottom: $unit-2x;
	}

	.sections {
		transition: opacity 0.15s ease;

		&.refreshing {
			opacity: 0.6;
		}
	}

	.section + .section {
		margin-top: $unit-4x;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: $unit;
		margin-bottom: calc($unit * 1.5);

		h2 {
			margin: 0;
			font-size: $font-medium;
			font-weight: $bold;
			color: var(--text-primary);
		}

		.sub {
			margin-left: $unit;
			font-size: $font-small;
			font-weight: $normal;
			color: var(--text-secondary);

			@media (max-width: 480px) {
				display: block;
				margin: $unit-fourth 0 0;
			}
		}
	}

	.see-all {
		color: var(--text-secondary);
		font-weight: $medium;
		text-decoration: none;
		white-space: nowrap;

		&:hover {
			color: var(--text-primary);
		}
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-error, #dc2626);

		p {
			margin: 0;
		}
	}
</style>
