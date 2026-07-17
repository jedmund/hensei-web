<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import { onDestroy } from 'svelte'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import type { SkillBoosts } from '$lib/types/api/skillBoosts'
	import DetailsSection from './details/DetailsSection.svelte'
	import SkillLabel from '$lib/components/SkillLabel.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Slider from '$lib/components/ui/Slider.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import { skillHighlight } from '$lib/stores/skillHighlight.svelte'
	import { getWeaponSkillIcon } from '$lib/utils/images'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		shortcode: string
		/** Party element id (1 wind … 6 light) for elemental slider theming */
		element?: number
	}

	let { shortcode, element }: Props = $props()

	let boosts = $state<SkillBoosts | null>(null)
	let error = $state(false)
	let loading = $state(true)

	// Battle-state conditions (the game's "Calculator Conditions"). The foe element
	// initializes from the server's advantaged-foe default on first load.
	// HP runs 1%, then 5% steps (1, 5, 10, … 100): slider stop 0 → 1%, stop n → n×5.
	let hpStop = $state(20)
	let allyMaxHp = $state<number | undefined>(undefined)
	let turn = $state(1)
	let foeElement = $state<string | undefined>(undefined)
	let arcarum = $state(false)

	const hpPercent = $derived(hpStop === 0 ? 1 : hpStop * 5)

	// API element words ↔ app element ids (0 null, 1 wind … 6 light)
	const ELEMENT_WORDS: Record<number, string> = {
		0: 'null',
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const foeElementId = $derived.by(() => {
		const entry = Object.entries(ELEMENT_WORDS).find(([, word]) => word === foeElement)
		return entry ? Number(entry[0]) : undefined
	})

	type SliderElement = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const partyElement = $derived(
		element ? (ELEMENT_WORDS[element] as SliderElement | undefined) : undefined
	)

	let requestId = 0
	async function refetch() {
		const id = ++requestId
		try {
			const result = await partyAdapter.getSkillBoosts(shortcode, {
				hpPercent,
				...(allyMaxHp != null ? { allyMaxHp } : {}),
				turn,
				...(foeElement ? { foeElement } : {}),
				arcarum
			})
			if (id !== requestId) return // a newer request superseded this one
			boosts = result
			allyMaxHp = result.state.allyMaxHp
			foeElement = result.state.foeElement
			arcarum = result.state.arcarum
			error = false
		} catch {
			if (id === requestId) error = true
		} finally {
			if (id === requestId) loading = false
		}
	}

	function handleMaxHpChange() {
		if (allyMaxHp != null) {
			allyMaxHp = Number.isFinite(allyMaxHp) ? Math.min(999_999, Math.max(0, allyMaxHp)) : undefined
		}
		refetch()
	}

	onMount(refetch)

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
		<div class="notice">
			<Notice variant="yellow">{m.calculator_alpha_notice()}</Notice>
		</div>

		<DetailsSection title={m.calculator_conditions()}>
			<div class="conditions">
				<div class="filter-group">
					<div class="filter-header">
						<span class="filter-label">{m.calculator_hp_value({ percent: String(hpPercent) })}</span
						>
					</div>
					<Slider
						value={hpStop}
						min={0}
						max={20}
						step={1}
						element={partyElement}
						onValueChange={(v) => {
							hpStop = v
							refetch()
						}}
					/>
				</div>
				<div class="filter-group">
					<div class="filter-header">
						<span class="filter-label">{m.calculator_max_hp()}</span>
					</div>
					<Input
						bind:value={allyMaxHp}
						type="number"
						min={0}
						max={999999}
						step={1}
						contained
						fullWidth
						onchange={handleMaxHpChange}
					/>
				</div>
				<div class="filter-group">
					<div class="filter-header">
						<span class="filter-label">{m.calculator_turn_value({ turn: String(turn) })}</span>
					</div>
					<Slider
						value={turn}
						min={1}
						max={20}
						step={1}
						element={partyElement}
						onValueChange={(v) => {
							turn = v
							refetch()
						}}
					/>
				</div>
				<div class="filter-group">
					<div class="filter-header">
						<span class="filter-label">{m.calculator_foe_element()}</span>
					</div>
					<ElementPicker
						value={foeElementId}
						contained
						includeAny
						size="small"
						class="foe-picker"
						onValueChange={(v) => {
							if (typeof v === 'number') {
								foeElement = ELEMENT_WORDS[v]
								refetch()
							}
						}}
					/>
				</div>
				<div class="filter-group">
					<div class="filter-header">
						<span class="filter-label">{m.calculator_arcarum()}</span>
						<Switch
							checked={arcarum}
							size="small"
							element={partyElement}
							onCheckedChange={(value) => {
								if (value === arcarum) return
								arcarum = value
								refetch()
							}}
						/>
					</div>
				</div>
			</div>
		</DetailsSection>

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

	.notice {
		padding: 0 $unit-2x;
	}

	.state {
		color: var(--text-tertiary);
		font-size: $font-regular;
		padding: $unit-2x 0;
		text-align: center;
	}

	.conditions {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 $unit-half;
	}

	.filter-label {
		display: block;
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-secondary);
	}

	// The sliders stretch with the column; the picker keeps its natural width.
	.filter-group :global(.foe-picker) {
		align-self: flex-start;
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
		width: $unit-3x;
		height: $unit-3x;
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
