<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import { onDestroy } from 'svelte'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import type { SkillBoosts } from '$lib/types/api/skillBoosts'
	import DetailsSection from './details/DetailsSection.svelte'
	import SkillLabel from '$lib/components/SkillLabel.svelte'
	import { skillHighlight } from '$lib/stores/skillHighlight.svelte'
	import { getWeaponSkillIcon } from '$lib/utils/images'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		shortcode: string
	}

	let { shortcode }: Props = $props()

	let boosts = $state<SkillBoosts | null>(null)
	let error = $state(false)
	let loading = $state(true)

	onMount(async () => {
		try {
			boosts = await partyAdapter.getSkillBoosts(shortcode)
		} catch {
			error = true
		} finally {
			loading = false
		}
	})

	// Never leave a stale highlight behind when the pane closes
	onDestroy(() => skillHighlight.clear())

	/** Currently expanded line ("key-series"), if any */
	let expanded = $state<string | null>(null)

	/** Format a breakdown number: trim trailing zeros, supplements as +N */
	function formatValue(value: number): string {
		if (Math.abs(value) >= 1000) return `+${value.toLocaleString()}`
		const rounded = Math.round(value * 100) / 100
		return `${rounded}%`
	}

	const enhancementRows = $derived(
		boosts
			? [
					{ key: 'optimus', label: m.calculator_enh_optimus(), value: boosts.enhancements.optimus },
					{ key: 'omega', label: m.calculator_enh_omega(), value: boosts.enhancements.omega },
					{ key: 'taboo', label: m.calculator_enh_taboo(), value: boosts.enhancements.taboo }
				].filter((row) => row.value > 0)
			: []
	)
</script>

<div class="calculator-pane">
	{#if loading}
		<div class="state">…</div>
	{:else if error}
		<div class="state">{m.calculator_error()}</div>
	{:else if boosts}
		{#if enhancementRows.length > 0}
			<DetailsSection title={m.calculator_enhancements()}>
				<ul class="rows">
					{#each enhancementRows as row (row.key)}
						<li class="row">
							<span class="name">{row.label}</span>
							<span class="value">{row.value}%</span>
						</li>
					{/each}
				</ul>
			</DetailsSection>
		{/if}

		<DetailsSection
			title={m.pane_skill_boosts()}
			empty={boosts.lines.length === 0}
			emptyMessage={m.calculator_empty()}
		>
			<ul class="rows">
				{#each boosts.lines as line (`${line.key}-${line.series ?? ''}`)}
					{@const lineKey = `${line.key}-${line.series ?? ''}`}
					<li
						class="row-group"
						onmouseenter={() => skillHighlight.set(line.sources)}
						onmouseleave={() => skillHighlight.clear()}
					>
						<button
							type="button"
							class="row"
							class:expanded={expanded === lineKey}
							onclick={() => (expanded = expanded === lineKey ? null : lineKey)}
							aria-expanded={expanded === lineKey}
						>
							<SkillLabel slug={line.labelSlug} label={line.label} />
							<span class="value" class:capped={line.capped}>{line.display}</span>
						</button>
						{#if expanded === lineKey && line.breakdown.length > 0}
							<ul class="breakdown">
								{#each line.breakdown as entry, i (i)}
									<li class="entry">
										<span class="entry-name">
											{#if entry.icon}
												{@const iconUrl = getWeaponSkillIcon(entry.icon, getLocale())}
												{#if iconUrl}
													<img class="entry-icon" src={iconUrl} alt="" loading="lazy" />
												{/if}
											{/if}
											<span class="entry-label"
												>{localizedName({ en: entry.name.en ?? '', ja: entry.name.ja ?? '' })}</span
											>
											{#if entry.count > 1}
												<span class="entry-count">×{entry.count}</span>
											{/if}
										</span>
										<span class="entry-value">
											{#if entry.base != null && entry.multiplier != null}
												<span class="entry-math"
													>{formatValue(entry.base)} × {entry.multiplier}</span
												>
											{/if}
											{formatValue(entry.value)}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</DetailsSection>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.calculator-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.state {
		color: var(--text-tertiary);
		font-size: $font-regular;
		padding: $unit-2x 0;
		text-align: center;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.row-group {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
		padding: $unit;
		width: 100%;
		border: none;
		background: transparent;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: $item-corner;
		@include smooth-transition($duration-quick, background-color);

		&:hover,
		&.expanded {
			background: var(--button-bg);
		}
	}

	.breakdown {
		list-style: none;
		margin: 0;
		padding: $unit-half $unit $unit ($unit * 3);
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.entry-name {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		min-width: 0;
	}

	.entry-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.entry-label {
		font-size: $font-small;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entry-count {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.entry-value {
		display: inline-flex;
		align-items: baseline;
		gap: $unit-half;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.entry-math {
		font-weight: $normal;
		color: var(--text-tertiary);
	}

	.name {
		font-size: $font-regular;
		color: var(--text-secondary);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.value {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;

		&.capped {
			color: var(--orange-text, #e08a00);
		}
	}
</style>
