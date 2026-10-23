<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import ContentUpdate from '$lib/components/about/ContentUpdate.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import * as m from '$lib/paraglide/messages'
	import updatesData from '$lib/data/updates.json'

	interface UpdateItems {
		characters?: string[]
		styles?: string[]
		weapons?: string[]
		summons?: string[]
	}

	interface UpdateEntry {
		version: string
		date: string
		event: string
		new?: UpdateItems
		uncapped?: UpdateItems
		transcended?: UpdateItems
		awakened?: string[]
		classes?: string[]
		manatura?: string[]
		shields?: string[]
		raids?: string[]
		notes?: string[]
		site?: ProductChanges
		extension?: ProductChanges
	}

	interface ProductChanges {
		new?: string[]
		improved?: string[]
		fixed?: string[]
	}

	type UpdateFilter = 'all' | 'game' | 'site' | 'extension'

	interface UpdateYear {
		year: number
		entries: UpdateEntry[]
	}

	const data = updatesData as UpdateYear[]

	let selectedYear = $state(data[0]?.year ?? 2024)
	let topEl: HTMLDivElement | undefined

	let filter = $state<UpdateFilter>('all')

	const years = $derived(data.map((y) => y.year))
	const currentYearData = $derived(data.find((y) => y.year === selectedYear))

	function hasGameChanges(entry: UpdateEntry): boolean {
		const hasItems = [entry.new, entry.uncapped, entry.transcended].some((items) =>
			Object.values(items ?? {}).some((ids) => ids?.length)
		)
		return (
			hasItems ||
			!!entry.awakened?.length ||
			!!entry.classes?.length ||
			!!entry.manatura?.length ||
			!!entry.shields?.length ||
			!!entry.raids?.length ||
			!!entry.notes?.length
		)
	}

	function matchesFilter(entry: UpdateEntry): boolean {
		switch (filter) {
			case 'all':
				return true
			case 'game':
				return hasGameChanges(entry)
			case 'site':
				return !!entry.site
			case 'extension':
				return !!entry.extension
		}
	}

	const visibleEntries = $derived(currentYearData?.entries.filter(matchesFilter) ?? [])

	const filterOptions: { value: UpdateFilter; label: string }[] = $derived([
		{ value: 'all', label: m.updates_filter_all() },
		{ value: 'game', label: m.updates_filter_game() },
		{ value: 'site', label: m.updates_filter_site() },
		{ value: 'extension', label: m.updates_filter_extension() }
	])

	function setFilter(value: UpdateFilter | undefined) {
		filter = value ?? 'all'
	}

	// The app layout scrolls inside .main-content, not the window
	function scrollToTop() {
		topEl?.closest('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
	}
</script>

<PageMeta title={m.page_title_updates()} description={m.page_desc_updates()} />

<div class="updates" bind:this={topEl}>
	<div class="controls">
		<div class="year-selector">
			{#each years as year (year)}
				<button
					class="year-item"
					class:active={selectedYear === year}
					onclick={() => (selectedYear = year)}
				>
					{year}
				</button>
			{/each}
		</div>
		<Select
			options={filterOptions}
			value={filter}
			onValueChange={setFilter}
			size="small"
			contentWidthOffset={100}
		/>
	</div>

	<div class="entries">
		{#if visibleEntries.length}
			{#each visibleEntries as entry (entry.version)}
				<ContentUpdate
					version={entry.version}
					date={entry.date}
					event={entry.event}
					new={entry.new}
					uncapped={entry.uncapped}
					transcended={entry.transcended}
					awakened={entry.awakened}
					classes={entry.classes}
					manatura={entry.manatura}
					shields={entry.shields}
					raids={entry.raids}
					notes={entry.notes}
					site={entry.site}
					extension={entry.extension}
					{filter}
				/>
			{/each}
		{:else}
			<p>{m.updates_no_updates()}</p>
		{/if}
	</div>

	<button class="back-to-top" onclick={scrollToTop}>
		<Icon name="arrow-up" size={16} />
	</button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;

	.updates {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
	}

	.year-selector {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
	}

	.year-item {
		all: unset;
		padding: $unit $unit-2x;
		border-radius: $input-corner;
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
		cursor: pointer;
		transition:
			background $duration-quick ease-out,
			color $duration-quick ease-out;

		&:hover {
			color: var(--text-primary);
			background: var(--link-item-hover-bg);
		}

		&.active {
			background: var(--accent-blue);
			color: var(--button-primary-text);
		}
	}

	.entries {
		display: flex;
		flex-direction: column;
		gap: $unit-6x;
	}

	.back-to-top {
		all: unset;
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
		cursor: pointer;
		color: var(--text-secondary);
		transition: color $duration-quick ease-out;

		&:hover {
			color: var(--text-primary);
		}
	}
</style>
