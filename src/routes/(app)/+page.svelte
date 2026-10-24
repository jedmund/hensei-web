<script lang="ts">
	import type { PageData } from './$types'
	import { createQuery, keepPreviousData } from '@tanstack/svelte-query'
	import { MediaQuery } from 'svelte/reactivity'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import EventSection from '$lib/components/home/EventSection.svelte'
	import EventSwitcher from '$lib/components/home/EventSwitcher.svelte'
	import NewItemsSection from '$lib/components/home/NewItemsSection.svelte'
	import HomeCard from '$lib/components/home/HomeCard.svelte'
	import { homeQueries } from '$lib/api/queries/home.queries'
	import { exploreQuery } from '$lib/utils/home'
	import { GALLERY_PATH, galleryPath } from '$lib/utils/browseRoutes'
	import { localizedName } from '$lib/utils/locale'
	import { getHostedImageUrl, getRaidImage } from '$lib/utils/images'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'

	let { data }: { data: PageData } = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

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
	const staffPicks = $derived(
		(home?.staffPicks ?? [])
			.toSorted((a, b) => a.position - b.position)
			.slice(0, isMobile.current ? 3 : 6)
	)

	const hasRanked = $derived(current.length + upcoming.length + rising.length + newItems.length > 0)
	const isEmpty = $derived(!!home && !hasRanked && staffPicks.length === 0)

	const risingHref = $derived(localizeHref(galleryPath(exploreQuery({ sort: 'participation' }))))
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
					<div class="section-head">
						<h2>{m.home_events()}</h2>
					</div>
					{#key selectedEvent.entry.event.id}
						<EventSection
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

			{#if newItems.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>{m.home_new_items()}</h2>
					</div>
					<NewItemsSection items={newItems} />
				</div>
			{/if}

			{#if rising.length > 0}
				<div class="section">
					<div class="section-head">
						<h2>{m.home_rising()}</h2>
					</div>
					<HomeCard>
						<ExploreGrid items={rising} contained />
						<Button href={risingHref} fullWidth>{m.home_see_all()}</Button>
					</HomeCard>
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
