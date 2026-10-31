<script lang="ts">
	/**
	 * Home card for battles released in the last 4 weeks: a row of battle
	 * thumbnails, the selected battle's banner, then its teams (most recent or
	 * trending) and a link to the rest of them in the Gallery.
	 */
	import EventSwitcher from '$lib/components/home/EventSwitcher.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import HomeCard from '$lib/components/home/HomeCard.svelte'
	import EmptyTeams from '$lib/components/home/EmptyTeams.svelte'
	import CardCover from '$lib/components/home/CardCover.svelte'
	import PinnedCardHeader from '$lib/components/home/PinnedCardHeader.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { escapeHtml } from '$lib/utils/safeHtml'
	import { formatDateJST } from '$lib/utils/date'
	import { getRaidImage } from '$lib/utils/images'
	import { exploreQuery } from '$lib/utils/home'
	import { galleryPath, newTeamPath } from '$lib/utils/browseRoutes'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { HomeNewBattle } from '$lib/types/api/home'
	import * as m from '$lib/paraglide/messages'
	import { MediaQuery, SvelteSet } from 'svelte/reactivity'

	interface Props {
		battles: HomeNewBattle[]
		/** The home section's title, shown at the top of the card */
		sectionTitle?: string
	}

	let { battles, sectionTitle }: Props = $props()

	let selectedId = $state<string | null>(null)
	const selected = $derived(battles.find((b) => b.raid.id === selectedId) ?? battles[0])

	type Order = 'recent' | 'trending'
	let order = $state<Order>('recent')
	const orderOptions = $derived([
		{ value: 'recent' as Order, label: m.home_battle_sort_recent() },
		{ value: 'trending' as Order, label: m.home_battle_sort_trending() }
	])
	const parties = $derived(selected ? selected[order] : [])

	const switcherItems = $derived(
		battles.map((battle) => ({
			id: battle.raid.id,
			label: localizedName(battle.raid.name),
			imageUrl: getRaidImage(battle.raid.slug, 'thumbnail'),
			tooltip: true,
			muted: battle.recent.length === 0
		}))
	)

	const thumbFailed = new SvelteSet<string>()
	const isMobile = new MediaQuery('(max-width: 768px)')

	// Solo fights have no banner art, so they get the placeholder
	const bannerUrl = $derived(
		selected && selected.raid.playerCount > 1 ? getRaidImage(selected.raid.slug, 'banner') : null
	)

	const seeAllHref = $derived(
		selected
			? localizeHref(
					galleryPath(
						exploreQuery({
							raidSlug: selected.raid.slug,
							sort: order === 'trending' ? 'participation' : undefined
						})
					)
				)
			: null
	)
	// A new team with the battle already set as its raid
	const newTeamHref = $derived(
		selected ? localizeHref(newTeamPath({ raidSlug: selected.raid.slug })) : null
	)
</script>

{#if selected}
	<section class="new-battles">
		<HomeCard title={sectionTitle}>
			<!-- The banners fade out at the edges; fade into the neutral background -->
			<CardCover src={bannerUrl} framed>
				{#snippet placeholder()}
					<!-- The battle's thumbnail, or its name when there's none either -->
					{#if thumbFailed.has(selected.raid.slug)}
						<span class="placeholder-name">{localizedName(selected.raid.name)}</span>
					{:else}
						<img
							class="placeholder"
							src={getRaidImage(selected.raid.slug, 'thumbnail')}
							alt=""
							loading="lazy"
							onerror={() => thumbFailed.add(selected.raid.slug)}
						/>
					{/if}
				{/snippet}
			</CardCover>

			<PinnedCardHeader>
				{#if switcherItems.length > 1}
					<EventSwitcher
						items={switcherItems}
						selected={selected.raid.id}
						onSelect={(id) => (selectedId = id)}
						label={m.home_new_battles()}
					/>
				{/if}

				<div class="heading-row">
					<div class="heading">
						<h3 class="title">{localizedName(selected.raid.name)}</h3>
						{#if selected.raid.releasedAt}
							<div class="meta">
								<span class="change">{m.home_item_change_release()}</span>
								<span class="date"
									>{formatDateJST(selected.raid.releasedAt, {
										month: 'short',
										day: 'numeric'
									})}</span
								>
							</div>
						{/if}
					</div>
					{#if selected.recent.length > 0}
						<Select
							options={orderOptions}
							value={order}
							onValueChange={(v) => (order = v ?? 'recent')}
							size="small"
							contained
							ariaLabel={m.home_battle_sort_aria()}
						/>
					{/if}
				</div>
			</PinnedCardHeader>

			{#if parties.length === 0}
				<EmptyTeams
					messageHtml={m.home_no_battle_teams({
						raid: escapeHtml(localizedName(selected.raid.name))
					})}
					href={newTeamHref}
				/>
			{:else}
				<ExploreGrid items={parties} showRaid={false} contained />
				{#if seeAllHref}
					<Button href={seeAllHref} fullWidth>
						<!-- Battle names are long; phones get the short label -->
						{isMobile.current
							? m.home_see_all()
							: m.home_see_all_raid({ raid: localizedName(selected.raid.name) })}
					</Button>
				{/if}
			{/if}
		</HomeCard>
	</section>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	// The battle's thumbnail, for solo fights and battles without a banner
	.placeholder {
		height: 60%;
		width: auto;
		object-fit: contain;
	}

	.placeholder-name {
		padding: $unit-2x;
		font-size: $font-medium;
		font-weight: $medium;
		color: var(--text-tertiary);
		text-align: center;
	}

	// The name and release date on the left, the team order on the right
	.heading-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;

		// The order picker keeps its size; the name wraps instead
		> :global(:last-child:not(.heading)) {
			flex: none;
		}
	}

	.heading {
		display: grid;
		gap: $unit-half;
		min-width: 0;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.title {
		margin: 0;
		font-size: $font-medium;
		font-weight: $medium;
		line-height: 1.25;
		color: var(--text-primary);
	}

	.change {
		padding: 2px $unit;
		border-radius: 999px;
		background: var(--button-bg);
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.date {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
