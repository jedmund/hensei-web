<script lang="ts">
	/**
	 * One event on the home page: a header card (banner, name, element,
	 * timing, raid switcher) followed by the selected raid's teams and a link
	 * to the rest of them in explore.
	 */
	import { MediaQuery } from 'svelte/reactivity'
	import { getHostedImageUrl } from '$lib/utils/images'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { formatDateJST } from '$lib/utils/date'
	import { getElementLabel } from '$lib/utils/element'
	import { exploreQuery, raidsWithParties, timeRemaining } from '$lib/utils/home'
	import { explorePath } from '$lib/utils/browseRoutes'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { GameEvent } from '$lib/types/api/event'
	import type { HomeRaidSection } from '$lib/types/api/home'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		event: GameEvent
		raids: HomeRaidSection[]
		/** Upcoming events show last time's teams */
		variant?: 'current' | 'upcoming'
		/** Upcoming only: whether there was a previous run */
		hasPrevious?: boolean
		/** Show the banner even on a compact card */
		showBanner?: boolean
		/** Cards on desktop (mobile always shows 3) */
		maxCards?: number
		/** Active sticker filter, carried into the explore links */
		sticker?: string | null
	}

	let {
		event,
		raids,
		variant = 'current',
		hasPrevious = true,
		showBanner = variant === 'current',
		maxCards = 3,
		sticker = null
	}: Props = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

	const tabs = $derived(raidsWithParties(raids))
	let selectedId = $state<string | null>(null)
	const selected = $derived(tabs.find((t) => t.raid.id === selectedId) ?? tabs[0])
	const cardCount = $derived(isMobile.current ? 3 : maxCards)
	const parties = $derived(selected?.parties.slice(0, cardCount) ?? [])

	const title = $derived(localizedName(event.name))
	const remaining = $derived(variant === 'current' ? timeRemaining(event.endsAt) : null)
	const timing = $derived.by(() => {
		if (variant === 'upcoming') {
			const date = m.home_starts_on({
				date: formatDateJST(event.startsAt, { month: 'short', day: 'numeric' })
			})
			return tabs.length > 0 && hasPrevious ? `${date} · ${m.home_from_last_time()}` : date
		}
		if (!remaining) return ''
		return remaining.unit === 'hours'
			? m.home_ends_in_hours({ hours: remaining.value })
			: m.home_ends_in_days({ days: remaining.value })
	})
	const endsLabel = $derived(formatDateJST(event.endsAt))

	const emptyMessage = $derived.by(() => {
		if (raids.length === 0) return m.home_no_raids()
		if (tabs.length > 0) return null
		return variant === 'upcoming' || !hasPrevious ? m.home_no_previous() : m.home_no_teams_event()
	})

	const seeAllHref = $derived(
		selected
			? localizeHref(
					explorePath(
						exploreQuery({
							raidSlug: selected.raid.slug,
							sticker,
							element: variant === 'current' ? event.advantageElement : null
						})
					)
				)
			: null
	)

	const raidOptions = $derived(
		tabs.map((t) => ({ value: t.raid.id, label: localizedName(t.raid.name) }))
	)
	// Upcoming and empty events get the compact card; a running event keeps its
	// large title even without banner art
	const compact = $derived(variant === 'upcoming' || emptyMessage !== null)
	const bannerUrl = $derived(
		showBanner && emptyMessage === null ? getHostedImageUrl(event.imageUrl) : null
	)
</script>

<section class="event-section">
	<div class="card" class:compact>
		{#if bannerUrl}
			<img class="banner" src={bannerUrl} alt="" loading="lazy" />
		{/if}

		<div class="title-row">
			{#if !compact}
				<h3 class="title large">{title}</h3>
			{:else}
				<h3 class="title">{title}</h3>
			{/if}
			{#if event.advantageElement}
				<span class="advantage">
					<ElementLabel element={event.advantageElement} size="small" />
					<span
						>{m.home_element_advantage({ element: getElementLabel(event.advantageElement) })}</span
					>
				</span>
			{/if}
			{#if timing}
				{#if variant === 'current'}
					<Tooltip content={endsLabel}>
						<span class="timing">{timing}</span>
					</Tooltip>
				{:else}
					<span class="timing">{timing}</span>
				{/if}
			{/if}
		</div>

		{#if emptyMessage}
			<p class="empty">{emptyMessage}</p>
		{:else if tabs.length > 1}
			{#if isMobile.current}
				<Select
					options={raidOptions}
					value={selected?.raid.id}
					onValueChange={(v) => (selectedId = v ?? null)}
					size="small"
					fullWidth
					contained
					label={m.home_raid_select_aria()}
				/>
			{:else}
				<SegmentedControl
					value={selected?.raid.id}
					onValueChange={(v) => (selectedId = v)}
					variant="background"
					size="small"
					grow
				>
					{#each tabs as tab (tab.raid.id)}
						<Segment value={tab.raid.id}>{localizedName(tab.raid.name)}</Segment>
					{/each}
				</SegmentedControl>
			{/if}
		{/if}
	</div>

	{#if !emptyMessage && selected}
		<ExploreGrid items={parties} showRaid={false} />
		{#if seeAllHref}
			<div class="below">
				<a class="see-all" href={seeAllHref}>
					{m.home_see_all_raid({ raid: localizedName(selected.raid.name) })} →
				</a>
			</div>
		{/if}
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/typography' as *;

	.event-section {
		margin-bottom: $unit-2x;
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: $page-corner;
		box-shadow: effects.$page-elevation;
		padding: $unit-2x $unit-2x calc($unit * 1.5);
		display: grid;
		gap: calc($unit * 1.5);
		margin-bottom: $unit;

		@media (max-width: 768px) {
			padding: calc($unit * 1.5);
		}
	}

	.banner {
		width: 100%;
		height: 120px;
		object-fit: cover;
		border-radius: $item-corner;

		@media (max-width: 768px) {
			height: 88px;
		}
	}

	.title-row {
		display: flex;
		align-items: baseline;
		gap: $unit;
		flex-wrap: wrap;
	}

	.title {
		margin: 0;
		font-size: $font-medium;
		font-weight: $medium;
		line-height: 1.25;
		color: var(--text-primary);

		&.large {
			font-size: $font-large;
		}
	}

	.advantage {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		align-self: center;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.timing {
		color: var(--text-secondary);
	}

	.empty {
		margin: 0;
		color: var(--text-tertiary);
	}

	.below {
		display: flex;
		justify-content: flex-end;
		margin: $unit 0;
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
</style>
