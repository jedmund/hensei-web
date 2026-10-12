<!-- GachaLog - The viewer's past draws, newest first; each row opens its result card -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { SvelteSet } from 'svelte/reactivity'
	import { slide } from 'svelte/transition'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import { groupByDay, type GachaLogEntry } from '$lib/utils/gachaLog'
	import type { CatalogueItem, GachaRenderData } from '$lib/types/gacha'

	interface Props {
		entries: GachaLogEntry[]
		currency?: GachaRenderData['currency']
		art?: GachaRenderData['art']
		onClear: () => void
	}

	let {
		entries,
		currency = $bindable('usd'),
		art = $bindable('character'),
		onClear
	}: Props = $props()

	/** SSR thumbnails shown in a row before the rest are counted */
	const THUMBNAILS = 6

	const days = $derived(groupByDay(entries))
	const expanded = new SvelteSet<string>()
	let confirmingClear = $state(false)

	const pools: Record<string, () => string> = {
		current: m.gacha_current,
		premium: m.gacha_premium,
		legend: m.gacha_legend,
		flash: m.gacha_flash,
		classic: m.gacha_classic,
		classic_ii: m.gacha_classic_ii,
		classic_iii: m.gacha_classic_iii
	}
	const seasons: Record<string, () => string> = {
		valentines: m.gacha_valentines,
		summer: m.gacha_summer,
		halloween: m.gacha_halloween,
		holiday: m.gacha_holiday,
		formal: m.gacha_formal
	}

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
	const count = (value: string) => BigInt(value).toLocaleString(getLocale())

	function poolLabel(entry: GachaLogEntry) {
		const { mode, season } = entry.result.configuration
		return [pools[mode]?.() ?? mode, season ? (seasons[season]?.() ?? season) : '']
			.filter(Boolean)
			.join(' · ')
	}

	function title(entry: GachaLogEntry) {
		const draws = count(entry.result.draws)
		return entry.operation === 'until' && entry.target
			? m.gacha_share_until({ name: name(entry.target), draws })
			: m.gacha_log_draws({ draws })
	}

	const time = (at: number) =>
		new Intl.DateTimeFormat(getLocale(), { timeStyle: 'short' }).format(new Date(at))

	function dayLabel(day: number) {
		const now = new Date()
		const midnight = (offset: number) =>
			new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset).getTime()
		if (day === midnight(0)) return m.time_today()
		if (day === midnight(1)) return m.time_yesterday()
		const date = new Date(day)
		return new Intl.DateTimeFormat(getLocale(), {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			...(date.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' })
		}).format(date)
	}

	/** SSRs in the order they were drawn, when the result kept the order */
	function ssrs(entry: GachaLogEntry): CatalogueItem[] {
		const items = entry.result.items ?? []
		const order = entry.result.ssr_order
		if (!order) return items
		const byIdentity = new Map(items.map((item) => [item.identity, item]))
		return order.flatMap((identity) => byIdentity.get(identity) ?? [])
	}

	function toggle(id: string) {
		if (expanded.has(id)) expanded.delete(id)
		else expanded.add(id)
	}
</script>

<!-- Each day's label heads its draws; the first day's row also holds Clear -->
<section class="log" aria-label={m.gacha_log()}>
	{#each days as day, index (day.day)}
		<section class="day" aria-label={dayLabel(day.day)}>
			<div class="day-head">
				<h2>{dayLabel(day.day)}</h2>
				{#if index === 0}
					<Button
						variant="ghost"
						size="small"
						type="button"
						onclick={() => (confirmingClear = true)}
					>
						{m.gacha_log_clear()}
					</Button>
				{/if}
			</div>
			<ol class="entries">
				{#each day.entries as entry (entry.id)}
					{@const drawn = ssrs(entry)}
					{@const open = expanded.has(entry.id)}
					<li>
						<button
							type="button"
							class="entry"
							aria-expanded={open}
							aria-controls="gacha-log-{entry.id}"
							onclick={() => toggle(entry.id)}
						>
							<span class="summary">
								<span class="entry-title">{title(entry)}</span>
								<span class="entry-meta">{poolLabel(entry)} · {time(entry.at)}</span>
							</span>
							{#if drawn.length > 0}
								<span class="thumbnails" aria-hidden="true">
									{#each drawn.slice(0, THUMBNAILS) as item, index (index)}
										<img src={gachaItemThumbnail(item)} alt="" title={name(item)} />
									{/each}
									{#if drawn.length > THUMBNAILS}
										<span class="more">+{drawn.length - THUMBNAILS}</span>
									{/if}
								</span>
							{/if}
							<span class="stats">
								<span>{count(entry.result.totals?.SSR ?? '0')} SSR</span>
								{#if entry.goldMoons}
									<span class="gold-moons">
										{entry.goldMoons === 1
											? m.gacha_gold_moon()
											: m.gacha_gold_moons({ count: count(String(entry.goldMoons)) })}
									</span>
								{/if}
							</span>
							<span class="chevron" class:open>
								<Icon name="chevron-down" size={16} />
							</span>
						</button>
						{#if open}
							<div id="gacha-log-{entry.id}" transition:slide={{ duration: 150 }}>
								<GachaResults
									result={entry.result}
									operation={entry.operation}
									target={entry.target}
									bind:currency
									bind:art
									link={entry.link}
								/>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</section>

<ConfirmDialog
	bind:open={confirmingClear}
	title={m.gacha_log_clear_title()}
	message={m.gacha_log_clear_message()}
	confirmLabel={m.gacha_log_clear()}
	onconfirm={() => {
		confirmingClear = false
		expanded.clear()
		onClear()
	}}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.log {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.day {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	// Same height whether or not the row holds Clear
	.day-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: $unit-4x;
		padding: 0 $unit-half 0 $unit-2x;

		h2 {
			margin: 0;
			font-size: $font-regular;
			font-weight: $medium;
			color: var(--text-secondary);
		}
	}

	.entries {
		display: flex;
		flex-direction: column;
		gap: $unit;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			flex-direction: column;
			gap: $unit;
		}
	}

	.entry {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		width: 100%;
		padding: $unit-2x;
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		background: var(--card-bg);
		color: var(--text-primary);
		font: inherit;
		text-align: left;
		cursor: pointer;
		@include smooth-transition($duration-quick, background);

		&:hover {
			background: var(--button-contained-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		flex: 1;
		min-width: 0;
	}

	.entry-title {
		font-weight: $medium;
	}

	.entry-meta {
		font-size: $font-small;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thumbnails {
		display: flex;
		align-items: center;
		gap: $unit-half;

		img {
			display: block;
			width: $unit-5x;
			height: $unit-5x;
			border-radius: $item-corner-small;
			object-fit: cover;
		}

		// Phones show the count, not the art
		@media (max-width: 600px) {
			display: none;
		}
	}

	// The count of SSRs past the thumbnails, in a tile the size of one
	.more {
		display: flex;
		align-items: center;
		justify-content: center;
		width: $unit-5x;
		height: $unit-5x;
		border-radius: $item-corner-small;
		background: var(--placeholder-bg);
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $bold;
		white-space: nowrap;
	}

	.stats {
		font-size: $font-small;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	// SSRs, then gold moons below when there are any
	.stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: $unit-half;
	}

	.gold-moons {
		color: var(--text-primary);
		font-weight: $medium;
	}

	.chevron {
		display: flex;
		color: var(--text-secondary);
		@include smooth-transition($duration-quick, transform);

		&.open {
			transform: rotate(180deg);
		}
	}
</style>
