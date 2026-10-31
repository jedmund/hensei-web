<script lang="ts">
	/**
	 * Home card for items released or uncapped in the last 18 days: a row of
	 * item thumbnails, then the selected item's teams and a link to the rest of
	 * them in the Gallery.
	 */
	import EventSwitcher from '$lib/components/home/EventSwitcher.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import HomeCard from '$lib/components/home/HomeCard.svelte'
	import PinnedCardHeader from '$lib/components/home/PinnedCardHeader.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { formatDateJST } from '$lib/utils/date'
	import { getCharacterImage, getSummonImage, getWeaponImage } from '$lib/utils/images'
	import { galleryPath, newTeamPath } from '$lib/utils/browseRoutes'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { HomeItemChange, HomeNewItem } from '$lib/types/api/home'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		items: HomeNewItem[]
		/** The home section's title, shown at the top of the card */
		sectionTitle?: string
	}

	let { items, sectionTitle }: Props = $props()

	let selectedId = $state<string | null>(null)
	// Opens on the first item someone has made a team with
	const selected = $derived(
		items.find((i) => i.item.id === selectedId) ??
			items.find((i) => i.parties.length > 0) ??
			items[0]
	)

	const CHANGE_LABELS: Record<HomeItemChange, () => string> = {
		release: m.home_item_change_release,
		flb: m.home_item_change_flb,
		ulb: m.home_item_change_ulb,
		transcendence: m.home_item_change_transcendence
	}

	// Characters show the art for the stage that made them new
	const CHARACTER_POSE: Record<HomeItemChange, string> = {
		release: '01',
		flb: '03',
		ulb: '03',
		transcendence: '04'
	}

	function itemImage({ item }: HomeNewItem): string {
		if (item.type === 'character')
			return getCharacterImage(item.granblueId, 'square', CHARACTER_POSE[item.change])
		if (item.type === 'weapon') return getWeaponImage(item.granblueId, 'square')
		return getSummonImage(item.granblueId, 'square')
	}

	const switcherItems = $derived(
		items.map((entry) => ({
			id: entry.item.id,
			label: localizedName(entry.item.name),
			imageUrl: itemImage(entry),
			tooltip: true,
			characterTags: entry.item.character,
			muted: entry.parties.length === 0
		}))
	)

	// The Gallery's include filter: c:/w:/s: plus the granblue id
	const seeAllHref = $derived(
		selected
			? localizeHref(galleryPath(`?inc=${selected.item.type[0]}:${selected.item.granblueId}`))
			: null
	)
	// A new team that starts with the item in its first slot
	const newTeamHref = $derived(
		selected
			? localizeHref(newTeamPath({ add: { type: selected.item.type, id: selected.item.id } }))
			: null
	)
</script>

{#if selected}
	<section class="new-items">
		<HomeCard title={sectionTitle}>
			<PinnedCardHeader>
				<!-- Always shown: the thumbnails are also the item's picture -->
				{#if switcherItems.length > 0}
					<EventSwitcher
						items={switcherItems}
						selected={selected.item.id}
						onSelect={(id) => (selectedId = id)}
						shape="square"
						label={m.home_new_items()}
					/>
				{/if}

				<div class="heading">
					<div class="name-row">
						<h3 class="title">{localizedName(selected.item.name)}</h3>
						{#if selected.item.character}
							<CharacterTags character={selected.item.character} />
						{/if}
					</div>
					<div class="meta">
						<span class="change">{CHANGE_LABELS[selected.item.change]()}</span>
						<span class="date"
							>{formatDateJST(selected.item.latestDate, { month: 'short', day: 'numeric' })}</span
						>
					</div>
				</div>
			</PinnedCardHeader>

			{#if selected.parties.length === 0}
				<div class="empty">
					<p>{m.home_no_item_teams({ item: localizedName(selected.item.name) })}</p>
					{#if newTeamHref}
						<Button href={newTeamHref}>{m.nav_new_team()}</Button>
					{/if}
				</div>
			{:else}
				<ExploreGrid items={selected.parties} showRaid contained />
			{/if}

			{#if seeAllHref && selected.parties.length > 0}
				<Button href={seeAllHref} fullWidth>
					{m.home_see_all_item({ item: localizedName(selected.item.name) })}
				</Button>
			{/if}
		</HomeCard>
	</section>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	// The name and its character tags, then what changed and when
	.heading {
		display: grid;
		gap: $unit-half;
	}

	.name-row,
	.meta {
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
	}

	.change {
		padding: 2px $unit;
		border-radius: 999px;
		background: var(--button-bg);
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	// Takes the space of one row of team cards plus the "see all" button
	// (231 + 12 gap + 44), so the card keeps its height when switching to an
	// item nobody has used yet
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc($unit * 1.5);
		min-height: 287px;
		color: var(--text-tertiary);
		text-align: center;

		p {
			margin: 0;
		}
	}

	.date {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
