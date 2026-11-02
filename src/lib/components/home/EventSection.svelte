<script lang="ts">
	/**
	 * One event on the home page: a card with the section title, the event's
	 * header (cover or thumbnail, name, element, countdown, raid switcher), the
	 * selected raid's teams and a link to the rest of them in the Gallery.
	 */
	import { mobileQuery } from '$lib/utils/viewport.svelte'
	import { getRaidImage } from '$lib/utils/images/raids'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import { getElementKey, getElementLabel } from '$lib/utils/element'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import HomeCard from '$lib/components/home/HomeCard.svelte'
	import CardCover from '$lib/components/home/CardCover.svelte'
	import PinnedCardHeader from '$lib/components/home/PinnedCardHeader.svelte'
	import EventLinksMenu from '$lib/components/home/EventLinksMenu.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { raidShortName } from '$lib/utils/raidName'
	import { formatDateJST } from '$lib/utils/date'
	import {
		countdownLabel,
		eventAdvantageElements,
		eventBanner,
		exploreQuery,
		raidsWithParties
	} from '$lib/utils/home'
	import { galleryPath, newTeamPath } from '$lib/utils/browseRoutes'
	import { escapeHtml } from '$lib/utils/safeHtml'
	import EmptyTeams from '$lib/components/home/EmptyTeams.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { GameEvent } from '$lib/types/api/event'
	import type { HomeRaidSection } from '$lib/types/api/home'
	import type { Snippet } from 'svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		event: GameEvent
		raids: HomeRaidSection[]
		/** Upcoming events show last time's teams */
		variant?: 'current' | 'upcoming'
		/** Upcoming only: whether there was a previous run */
		hasPrevious?: boolean
		/** Most teams to show (in-card grids show at most 4 on mobile) */
		maxCards?: number
		/** Rendered under the cover, e.g. thumbnails to switch events */
		switcher?: Snippet
		/** The home section's title, shown at the top of the card */
		sectionTitle?: string
	}

	let {
		event,
		raids,
		variant = 'current',
		hasPrevious = true,
		maxCards = 3,
		switcher,
		sectionTitle
	}: Props = $props()

	const isMobile = mobileQuery()

	// Every raid gets a tab, teams or not, so the event's battles show before
	// anyone has posted
	const tabs = $derived(raids)
	const hasTeams = $derived(raidsWithParties(raids).length > 0)
	let selectedId = $state<string | null>(null)
	// Opens on the raid with the most teams (the first, on a tie)
	const busiest = $derived(
		tabs.reduce<(typeof tabs)[number] | undefined>(
			(best, t) => (!best || t.parties.length > best.parties.length ? t : best),
			undefined
		)
	)
	const selected = $derived(tabs.find((t) => t.raid.id === selectedId) ?? busiest)
	const parties = $derived(selected?.parties.slice(0, maxCards) ?? [])

	const title = $derived(localizedName(event.name))
	// One element, or two for Records of the Ten's Fire and Dark run
	const advantages = $derived(eventAdvantageElements(event))
	// Ticks once a minute so the countdown stays current
	let now = $state(Date.now())
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 60_000)
		return () => clearInterval(timer)
	})

	const duration = $derived(
		countdownLabel(variant === 'upcoming' ? event.startsAt : event.endsAt, now)
	)
	const timing = $derived.by(() => {
		if (!duration) return ''
		if (variant === 'current') return m.home_ends_in({ duration })
		const starts = m.home_starts_in({ duration })
		return hasTeams && hasPrevious ? `${starts} · ${m.home_from_last_time()}` : starts
	})
	// Exact time in JST on hover
	const dateLabel = $derived(formatDateJST(variant === 'upcoming' ? event.startsAt : event.endsAt))

	// Nothing to pick from: the card says so in place of the tabs
	const emptyMessage = $derived(raids.length === 0 ? m.home_no_raids() : null)
	// A new team with the selected raid already set
	const newTeamHref = $derived(
		selected ? localizeHref(newTeamPath({ raidSlug: selected.raid.slug })) : null
	)

	// Only when the Gallery has teams beyond the ones shown here
	const seeAllHref = $derived(
		selected && (selected.hasMore !== false || selected.parties.length > parties.length)
			? localizeHref(
					galleryPath(
						exploreQuery({
							raidSlug: selected.raid.slug,
							elements: variant === 'current' ? advantages : undefined
						})
					)
				)
			: null
	)

	const raidOptions = $derived(
		tabs.map((t) => ({ value: t.raid.id, label: raidShortName(t.raid) }))
	)
	// Upcoming and empty events get a compact title; a running event keeps its
	// large title even without banner art
	const compact = $derived(variant === 'upcoming' || !hasTeams)
	// The event's header image (its own, or its series'), shown as a cover
	// In the reader's language, falling back to English (see eventBanner)
	const banner = $derived(eventBanner(event))
	const coverUrl = $derived(banner.src)
	// Without a banner, the art of its first linked raid as a thumbnail
	const thumbnailUrl = $derived.by(() => {
		if (coverUrl) return null
		const slug = raids[0]?.raid.slug ?? event.raids[0]?.slug
		return slug ? getRaidImage(slug, 'thumbnail') : null
	})
</script>

<section class="event-section">
	<HomeCard title={sectionTitle}>
		{#if coverUrl}
			<!-- The cover art names the event, so the title is only for screen readers -->
			<h3 class="visually-hidden">{title}</h3>
			<CardCover src={coverUrl} fallback={banner.fallback}>
				<div class="links">
					<EventLinksMenu {event} />
				</div>
				{#if advantages.length > 0 || timing}
					<div class="overlay">
						{#if advantages.length > 0}
							<span class="advantages">
								{#each advantages as element (element)}
									<span
										class="pill advantage"
										style:--advantage-color="var(--{getElementKey(element)}-text)"
										style:--advantage-bg="var(--{getElementKey(element)}-bg)"
									>
										{m.home_element_advantage({ element: getElementLabel(element) })}
									</span>
								{/each}
							</span>
						{/if}
						{#if timing}
							<span class="timing-slot">
								<Tooltip content={dateLabel}>
									<span class="pill">{timing}</span>
								</Tooltip>
							</span>
						{/if}
					</div>
				{/if}
			</CardCover>
		{/if}
		<!-- Event and raid pickers stay at the top of the screen while the card scrolls past -->
		<PinnedCardHeader>
			{@render switcher?.()}
			{#if !coverUrl}
				<div class="header">
					{#if thumbnailUrl}
						<img class="thumbnail" src={thumbnailUrl} alt="" loading="lazy" />
					{/if}
					<div class="heading">
						<div class="title-row">
							<h3 class="title" class:large={!compact}>{title}</h3>
							{#each advantages as element (element)}
								<ElementLabel {element} size="small" />
							{/each}
						</div>
						{#if timing}
							<Tooltip content={dateLabel}>
								<span class="timing">{timing}</span>
							</Tooltip>
						{/if}
					</div>
				</div>
			{/if}
			{#if !emptyMessage && tabs.length > 1}
				{#if isMobile.current}
					<!-- On mobile the link to the rest of the raid's teams sits by the picker -->
					<div class="raid-row">
						<Select
							options={raidOptions}
							value={selected?.raid.id}
							onValueChange={(v) => (selectedId = v ?? null)}
							fullWidth
							contained
							ariaLabel={m.home_raid_select_aria()}
						/>
						{#if seeAllHref}
							<Button href={seeAllHref}>{m.home_see_all()}</Button>
						{/if}
					</div>
				{:else}
					<SegmentedControl
						value={selected?.raid.id}
						onValueChange={(v) => (selectedId = v)}
						variant="background"
						size="small"
						grow
					>
						{#each tabs as tab (tab.raid.id)}
							<Segment value={tab.raid.id}>{raidShortName(tab.raid)}</Segment>
						{/each}
					</SegmentedControl>
				{/if}
			{/if}
		</PinnedCardHeader>

		{#if emptyMessage}
			<p class="empty">{emptyMessage}</p>
		{:else if selected && selected.parties.length === 0}
			<!-- Upcoming events show last time's teams, named by the raid's short name -->
			<EmptyTeams
				messageHtml={variant === 'upcoming'
					? m.home_no_raid_teams({ raid: escapeHtml(raidShortName(selected.raid)) })
					: m.home_no_battle_teams({ raid: escapeHtml(localizedName(selected.raid.name)) })}
				href={newTeamHref}
			/>
		{:else if selected}
			<ExploreGrid items={parties} showRaid={false} contained />
			{#if seeAllHref && !(isMobile.current && tabs.length > 1)}
				<Button href={seeAllHref} fullWidth>
					{m.home_see_all_raid({ raid: localizedName(selected.raid.name) })}
				</Button>
			{/if}
		{/if}
	</HomeCard>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	// Raid picker and its "See all" link, side by side on mobile
	.raid-row {
		display: flex;
		align-items: stretch;
		gap: $unit;

		// The Select takes the room the button doesn't
		> :global(:first-child) {
			flex: 1;
			min-width: 0;
		}
	}

	// The event's pages on other sites, in the cover's top right corner
	.links {
		position: absolute;
		top: $unit-2x;
		right: $unit-2x;

		@media (max-width: 768px) {
			top: $unit;
			right: $unit;
		}
	}

	// Element on the left, countdown on the right, along the cover's bottom.
	// On mobile they stack on the left.
	.overlay {
		position: absolute;
		left: $unit-2x;
		right: $unit-2x;
		bottom: $unit-2x;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
		flex-wrap: wrap;

		@media (max-width: 768px) {
			left: $unit;
			right: $unit;
			bottom: $unit;
			flex-direction: column;
			align-items: flex-start;
			gap: $unit-half;
		}
	}

	// Two pills for a two-element run, side by side
	.advantages {
		display: flex;
		gap: $unit-half;
	}

	// Stays on the right even when there's no element
	.timing-slot {
		margin-left: auto;

		@media (max-width: 768px) {
			margin-left: 0;
		}
	}

	.pill {
		display: inline-flex;
		align-items: center;
		padding: $unit-half $unit;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		color: #fff;
		font-size: $font-small;
		font-weight: $medium;
		line-height: 1.2;
		white-space: nowrap;
	}

	// The element players should bring, in that element's colors
	.advantage {
		background: var(--advantage-bg);
		backdrop-filter: none;
		color: var(--advantage-color);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	.header {
		display: flex;
		align-items: center;
		gap: $unit-2x;
	}

	.heading {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: $unit-half;
		justify-items: start;
	}

	.title-row {
		display: flex;
		align-items: center;
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

	.timing {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.thumbnail {
		flex: none;
		width: 90px;
		aspect-ratio: 180 / 126;
		object-fit: cover;
		border-radius: $item-corner;

		@media (max-width: 768px) {
			width: 72px;
		}
	}

	// Takes the space of one row of team cards plus the "see all" button
	// (231 + 12 gap + 44), like the new items card
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 287px;
		margin: 0;
		color: var(--text-tertiary);
		text-align: center;
	}
</style>
