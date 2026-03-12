<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import ContentUpdate from '$lib/components/about/ContentUpdate.svelte'
	import * as m from '$lib/paraglide/messages'
	import updatesData from '$lib/data/updates.json'

	interface UpdateItems {
		characters?: string[]
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
		raids?: string[]
		notes?: string[]
	}

	interface UpdateYear {
		year: number
		entries: UpdateEntry[]
	}

	const data = updatesData as UpdateYear[]

	let selectedYear = $state(data[0]?.year ?? 2024)
	let topEl: HTMLDivElement | undefined

	const years = $derived(data.map((y) => y.year))
	const currentYearData = $derived(data.find((y) => y.year === selectedYear))

	function scrollToTop() {
		topEl?.scrollIntoView({ behavior: 'smooth' })
	}
</script>

<PageMeta title={m.page_title_updates()} description={m.page_desc_updates()} />

<div class="updates" bind:this={topEl}>
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

	<div class="entries">
		{#if currentYearData}
			{#each currentYearData.entries as entry (entry.version)}
				<ContentUpdate
					version={entry.version}
					date={entry.date}
					event={entry.event}
					new={entry.new}
					uncapped={entry.uncapped}
					transcended={entry.transcended}
					awakened={entry.awakened}
					raids={entry.raids}
					notes={entry.notes}
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

	.year-selector {
		display: flex;
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
