<script lang="ts">
	/**
	 * The Home page: upcoming events, new items, rising teams and staff picks.
	 * Rendered at `/` once Home is launched, at `/home` until then.
	 */
	import type { HomeLoad } from '$lib/server/home'
	import { createQuery, keepPreviousData } from '@tanstack/svelte-query'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import EventSection from '$lib/components/home/EventSection.svelte'
	import EventSwitcher from '$lib/components/home/EventSwitcher.svelte'
	import NewItemsSection from '$lib/components/home/NewItemsSection.svelte'
	import NewBattlesSection from '$lib/components/home/NewBattlesSection.svelte'
	import HomeCard from '$lib/components/home/HomeCard.svelte'
	import { homeQueries } from '$lib/api/queries/home.queries'
	import { exploreQuery } from '$lib/utils/home'
	import { GALLERY_PATH, galleryPath } from '$lib/utils/browseRoutes'
	import { localizedName } from '$lib/utils/locale'
	import { getHostedImageUrl } from '$lib/utils/images/core'
	import { getRaidImage } from '$lib/utils/images/raids'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'

	let { data }: { data: HomeLoad } = $props()

	const homeQuery = createQuery(() => ({
		...homeQueries.sections(),
		initialData: data.home ?? undefined,
		initialDataUpdatedAt: data.home ? Date.now() : undefined,
		placeholderData: keepPreviousData
	}))

	const home = $derived(homeQuery.data)
	const refreshing = $derived(homeQuery.isPlaceholderData)
	const loadError = $derived(
		homeQuery.isError
			? (homeQuery.error?.message ?? m.explore_unknown_error())
			: !homeQuery.data
				? data.loadError
				: null
	)

	const current = $derived(home?.current ?? [])
	const upcoming = $derived(home?.upcoming ?? [])

	// Running events first, then upcoming ones, shown one at a time
	const events = $derived([
		...current.map((entry) => ({ entry, variant: 'current' as const })),
		...upcoming.map((entry) => ({ entry, variant: 'upcoming' as const }))
	])
	let selectedEventId = $state<string | null>(null)
	const selectedEvent = $derived(
		events.find((e) => e.entry.event.id === selectedEventId) ?? events[0]
	)
	const switcherItems = $derived(
		events.map(({ entry }) => {
			const slug = entry.raids[0]?.raid.slug ?? entry.event.raids[0]?.slug
			return {
				id: entry.event.id,
				label: localizedName(entry.event.name),
				imageUrl:
					getHostedImageUrl(entry.event.imageUrl) ?? (slug ? getRaidImage(slug, 'thumbnail') : null)
			}
		})
	)
	const rising = $derived((home?.rising ?? []).slice(0, 9))
	const newItems = $derived(home?.newItems ?? [])
	const newBattles = $derived(home?.newBattles ?? [])
	// New items and New battles come after the events, newest change first
	const latestItem = $derived(
		newItems.reduce((max, n) => (n.item.latestDate > max ? n.item.latestDate : max), '')
	)
	const latestBattle = $derived(
		newBattles.reduce(
			(max, b) => ((b.raid.releasedAt ?? '') > max ? (b.raid.releasedAt ?? '') : max),
			''
		)
	)
	const battlesFirst = $derived(latestBattle > latestItem)
	const staffPicks = $derived(
		(home?.staffPicks ?? []).toSorted((a, b) => a.position - b.position).slice(0, 6)
	)

	const hasRanked = $derived(
		current.length + upcoming.length + rising.length + newItems.length + newBattles.length > 0
	)
	const isEmpty = $derived(!!home && !hasRanked && staffPicks.length === 0)

	const risingHref = $derived(localizeHref(galleryPath(exploreQuery({ sort: 'rising' }))))
</script>

<PageMeta title={m.page_title_home()} description={m.page_desc_home_events()} />

<section class="home">
	{#if loadError && !home}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>{m.explore_load_error({ error: loadError })}</p>
			<Button size="small" onclick={() => homeQuery.refetch()}>{m.retry()}</Button>
		</div>
	{:else if isEmpty}
		<EmptyState message={m.home_empty()}>
			<Button size="small" href={localizeHref(GALLERY_PATH)}>{m.home_browse_all()}</Button>
		</EmptyState>
	{:else if home}
		<div class="sections" class:refreshing>
			{#if selectedEvent}
				<div class="section">
					{#key selectedEvent.entry.event.id}
						<EventSection
							sectionTitle={m.home_events()}
							event={selectedEvent.entry.event}
							raids={selectedEvent.entry.raids}
							variant={selectedEvent.variant}
							hasPrevious={'previousEvent' in selectedEvent.entry &&
								selectedEvent.entry.previousEvent !== null}
							maxCards={6}
						>
							{#snippet switcher()}
								{#if switcherItems.length > 1}
									<EventSwitcher
										items={switcherItems}
										selected={selectedEvent.entry.event.id}
										onSelect={(id) => (selectedEventId = id)}
									/>
								{/if}
							{/snippet}
						</EventSection>
					{/key}
				</div>
			{/if}

			{#snippet newItemsCard()}
				{#if newItems.length > 0}
					<div class="section">
						<NewItemsSection items={newItems} sectionTitle={m.home_new_items()} />
					</div>
				{/if}
			{/snippet}
			{#snippet newBattlesCard()}
				{#if newBattles.length > 0}
					<div class="section">
						<NewBattlesSection battles={newBattles} sectionTitle={m.home_new_battles()} />
					</div>
				{/if}
			{/snippet}
			{#if battlesFirst}
				{@render newBattlesCard()}
				{@render newItemsCard()}
			{:else}
				{@render newItemsCard()}
				{@render newBattlesCard()}
			{/if}

			{#if rising.length > 0}
				<div class="section">
					<HomeCard title={m.home_rising()}>
						<ExploreGrid items={rising} contained />
						<Button href={risingHref} fullWidth>{m.home_see_all()}</Button>
					</HomeCard>
				</div>
			{/if}

			{#if staffPicks.length > 0}
				<div class="section">
					<HomeCard title={m.home_staff_picks()}>
						<ExploreGrid items={staffPicks.map((pick) => pick.party)} contained>
							{#snippet card(party, index)}
								{@const note = staffPicks[index]?.note}
								{@const noteText = note ? localizedName(note) : ''}
								{#if noteText && noteText !== '—'}
									<GridRep {party} outlined>
										{#snippet footer()}{noteText}{/snippet}
									</GridRep>
								{:else}
									<GridRep {party} outlined />
								{/if}
							{/snippet}
						</ExploreGrid>
					</HomeCard>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.home {
		padding: $unit-2x 0;

		@media (max-width: 768px) {
			padding: $unit-2x $unit;
		}
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
