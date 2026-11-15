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
	import { getWeaponSkillIcon } from '$lib/utils/images/icons'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localizedName } from '$lib/utils/locale'
	import { getElementFromKey, getElementKey, getElementTypeKey } from '$lib/utils/element'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import type { SkillBoostLine } from '$lib/types/api/skillBoosts'
	import type { GridSummon } from '$lib/types/api/party'
	import type { SummonAura } from '$lib/types/api/entities'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import SummonAuraText from './details/SummonAuraText.svelte'
	import AuraScaling from './details/AuraScaling.svelte'
	import { getSummonImage, getSummonTransformation } from '$lib/utils/images/summons'
	import { seriesHasUlbArt } from '$lib/utils/summonSeries'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import { formatBoostNumber, formatBoostValue } from '$lib/utils/skillBoostFormat'

	interface Props {
		shortcode: string
		/** Party element id for elemental slider theming */
		element?: number
	}

	let { shortcode, element }: Props = $props()

	let boosts = $state<SkillBoosts | null>(null)
	let error = $state(false)
	let loading = $state(true)
	/** A recalculation after the first load is in flight */
	let recalculating = $state(false)

	// Battle-state conditions (the game's "Calculator Conditions"). The foe element
	// initializes from the server's advantaged-foe default on first load.
	// HP runs 1%, then 5% steps (1, 5, 10, … 100): slider stop 0 → 1%, stop n → n×5.
	const INITIAL_HP_STOP = 20
	const INITIAL_TURN = 1
	let hpStop = $state(INITIAL_HP_STOP)
	let allyMaxHp = $state<number | undefined>(undefined)
	let turn = $state(INITIAL_TURN)
	let foeElement = $state<string | undefined>(undefined)
	let arcarum = $state(false)

	const hpPercent = $derived(hpStop === 0 ? 1 : hpStop * 5)

	// The API names elements by their lowercase key ('null', 'fire', …)
	const foeElementId = $derived(getElementFromKey(foeElement))
	const partyElement = $derived(getElementTypeKey(element))

	let requestId = 0
	async function refetch() {
		const id = ++requestId
		if (!loading) recalculating = true
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
			if (id === requestId) {
				loading = false
				recalculating = false
			}
		}
	}

	function handleMaxHpChange() {
		if (allyMaxHp != null) {
			allyMaxHp = Number.isFinite(allyMaxHp) ? Math.min(999_999, Math.max(0, allyMaxHp)) : undefined
		}
		refetch()
	}

	// Sliders update their label while dragging but only recalculate on release,
	// and skip the request when the value lands where it started.
	let committedHpStop = INITIAL_HP_STOP
	let committedTurn = INITIAL_TURN

	function commitHp(v: number) {
		if (v === committedHpStop) return
		committedHpStop = v
		hpStop = v
		refetch()
	}

	function commitTurn(v: number) {
		if (v === committedTurn) return
		committedTurn = v
		turn = v
		refetch()
	}

	onMount(refetch)

	// Never leave a stale highlight behind when the pane closes
	onDestroy(() => skillHighlight.clear())

	/** Currently expanded line ("key-series"), if any */
	let expanded = $state<string | null>(null)

	// Skills the game counts in Estimated DMG without a panel line come back in a
	// "hidden" group; they're listed apart, below the panel's own lines.
	const panelLines = $derived(boosts ? boosts.lines.filter((line) => line.group !== 'hidden') : [])
	const hiddenLines = $derived(boosts ? boosts.lines.filter((line) => line.group === 'hidden') : [])

	// The auras the team's summons give, as the game applies them: the main and friend
	// summons' main aura, every other slot's sub aura (each grid summon's activeAura).
	function auraRole(summon: GridSummon): string {
		if (summon.main) return m.aura_role_main()
		if (summon.friend) return m.summon_friend_label()
		return m.aura_role_sub()
	}
	let activeTab = $state<'skills' | 'auras'>('skills')
	// The summon's square art, at the transformation its uncap shows (as SummonUnit does)
	function auraImage(summon: GridSummon): string {
		const transformation = getSummonTransformation(
			summon.summon.granblueId,
			summon.uncapLevel,
			summon.transcendenceStep,
			seriesHasUlbArt(summon.summon.series)
		)
		return getSummonImage(summon.summon.granblueId, 'square', transformation)
	}
	// One row per distinct aura: summons giving the very same aura tier (a main and friend
	// copy at the same uncap, or the same summon in two sub slots) share a row, listing
	// each of their slots once. Main, then friend, then subs by position.
	type AuraRow = { aura: SummonAura; summons: GridSummon[]; roles: string[] }
	const auraRows = $derived.by(() => {
		const rank = (s: GridSummon) => (s.main ? 0 : s.friend ? 1 : 2)
		const sorted = (partyStore.party?.summons ?? [])
			.filter((summon) => summon.activeAura)
			.toSorted((a, b) => rank(a) - rank(b) || a.position - b.position)
		const rows: AuraRow[] = []
		for (const summon of sorted) {
			const aura = summon.activeAura as SummonAura
			let row = rows.find((r) => r.aura.id === aura.id)
			if (!row) {
				row = { aura, summons: [], roles: [] }
				rows.push(row)
			}
			row.summons.push(summon)
			const role = auraRole(summon)
			if (!row.roles.includes(role)) row.roles.push(role)
		}
		return rows
	})

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

{#snippet lineRow(line: SkillBoostLine, hidden: boolean)}
	{@const lineKey = `${line.key}-${line.series ?? ''}-${hidden ? 'hidden' : ''}`}
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
			{#if hidden}
				<Tooltip content={m.calculator_hidden_stat_tooltip()}>
					<span class="value hidden">{formatBoostValue(line.value, line.flat)}</span>
				</Tooltip>
			{:else}
				<span class="value" class:capped={line.capped}
					>{formatBoostValue(line.value, line.flat)}</span
				>
			{/if}
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
									>{formatBoostValue(entry.base, line.flat)} × {formatBoostNumber(
										entry.multiplier
									)}</span
								>
							{/if}
							{formatBoostValue(entry.value, line.flat)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

{#snippet recalculatingIndicator()}
	{#if recalculating}
		<span class="recalculating" role="status" aria-label={m.calculator_recalculating()}>
			<Icon name="loader-2" size={16} />
		</span>
	{/if}
{/snippet}

<div class="calculator-pane" aria-busy={loading || recalculating}>
	{#if auraRows.length > 0}
		<div class="tabs">
			<SegmentedControl bind:value={activeTab} variant="background" size="small" grow>
				<Segment value="skills">{m.calculator_tab_skills()}</Segment>
				<Segment value="auras">{m.details_auras()}</Segment>
			</SegmentedControl>
		</div>
	{/if}

	{#if activeTab === 'auras' && auraRows.length > 0}
		<DetailsSection title={m.details_auras()}>
			<ul class="rows">
				{#each auraRows as row (row.aura.id)}
					{@const summon = row.summons[0] as GridSummon}
					<li
						class="aura-row"
						onmouseenter={() => skillHighlight.setSummons(row.summons.map((s) => s.id))}
						onmouseleave={() => skillHighlight.clear()}
					>
						<img
							class="aura-image"
							src={auraImage(summon)}
							alt={localizedName(summon.summon.name)}
							loading="lazy"
						/>
						<div class="aura-info">
							<span class="aura-name">{localizedName(summon.summon.name)}</span>
							<span class="aura-role">{row.roles.join(' · ')}</span>
							<SummonAuraText aura={row.aura} class="aura-text" />
							{#if summon.activeAuraScaling}
								<AuraScaling scaling={summon.activeAuraScaling} />
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</DetailsSection>
	{:else if loading}
		<div class="loading-state" role="status" aria-label={m.calculator_loading()}>
			<Icon name="loader-2" size={24} />
		</div>
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
						onValueChange={(v) => (hpStop = v)}
						onValueCommit={commitHp}
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
						onValueChange={(v) => (turn = v)}
						onValueCommit={commitTurn}
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
								foeElement = getElementKey(v)
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
				<ul class="rows" class:stale={recalculating}>
					{#each enhancementRows as row (row.key)}
						<li class="row">
							<span class="name">{row.label}</span>
							<span class="value">{formatBoostValue(row.value)}</span>
						</li>
					{/each}
				</ul>
			</DetailsSection>
		{/if}

		<DetailsSection
			title={m.pane_skill_boosts()}
			empty={panelLines.length === 0}
			emptyMessage={m.calculator_empty()}
			action={recalculatingIndicator}
		>
			<ul class="rows" class:stale={recalculating}>
				{#each panelLines as line (`${line.key}-${line.series ?? ''}`)}
					{@render lineRow(line, false)}
				{/each}
			</ul>
		</DetailsSection>

		{#if hiddenLines.length > 0}
			<DetailsSection title={m.calculator_hidden_stats()}>
				<ul class="rows" class:stale={recalculating}>
					{#each hiddenLines as line (`${line.key}-${line.series ?? ''}`)}
						{@render lineRow(line, true)}
					{/each}
				</ul>
			</DetailsSection>
		{/if}
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
		flex: 1;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: var(--text-tertiary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.recalculating {
		display: inline-flex;
		color: var(--text-tertiary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
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
		@include smooth-transition($duration-quick, opacity);

		&.stale {
			opacity: 0.5;
		}
	}

	.row-group {
		display: flex;
		flex-direction: column;
	}

	.tabs {
		padding: 0 $unit-2x;
	}

	// The summon's square art, then its name, slot and aura
	.aura-row {
		display: flex;
		align-items: flex-start;
		gap: $unit * 1.5;
		padding: $unit;
		border-radius: $item-corner;
		@include smooth-transition($duration-quick, background-color);

		// Hovering highlights the summon the aura comes from (skillHighlight)
		&:hover {
			background: var(--button-bg);
		}
	}

	.aura-image {
		flex: 0 0 auto;
		width: $unit-5x;
		height: $unit-5x;
		border-radius: $item-corner-small;
		object-fit: cover;
	}

	.aura-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.aura-name {
		font-weight: $medium;
	}

	.aura-role {
		color: var(--text-tertiary);
		font-size: $font-small;
		margin-top: $unit-half;
		margin-bottom: $unit-half;
	}

	.aura-row :global(.aura-text) {
		color: var(--text-secondary);
		font-size: $font-small;
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

		&.hidden {
			color: var(--text-secondary);
			text-decoration: underline dotted;
			text-underline-offset: 3px;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
