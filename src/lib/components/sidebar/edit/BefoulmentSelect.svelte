<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import type { Befoulment, WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'

	interface Props {
		/** Current befoulment on the weapon (bindable) */
		currentBefoulment?: Befoulment | null
		/** Language for display */
		locale?: 'en' | 'ja'
		/** Maximum exorcism level for this weapon (from weapon's maxExorcismLevel) */
		maxExorcismLevel?: number | null
	}

	let {
		currentBefoulment = $bindable<Befoulment | null>(null),
		locale = 'en',
		maxExorcismLevel = null
	}: Props = $props()

	const befoulmentQuery = createQuery(() => entityQueries.befoulments())

	// Derive display values directly from the bound prop
	const selectedModifierId = $derived(currentBefoulment?.modifier?.id ?? '')
	const strength = $derived(currentBefoulment?.strength ?? 0)
	const permeation = $derived(currentBefoulment?.permeation ?? 1)
	// The game starts every weapon at Exorcision Lvl 1; stored 0 is legacy data.
	const exorcismLevel = $derived(Math.max(currentBefoulment?.exorcismLevel ?? 1, 1))

	// Get selected modifier from query data
	const selectedModifier = $derived(
		selectedModifierId
			? (befoulmentQuery.data ?? []).find((m) => m.id === selectedModifierId)
			: undefined
	)

	// Each level-up past the starting Lvl 1 (up to 4 of them) weakens the befoulment
	// by 1x, 2x, or 3x the modifier's reduction step (gbf.wiki/Befoulments).
	const reductions = $derived(Math.max(exorcismLevel - 1, 0))
	const step = $derived(selectedModifier?.reductionStep ?? 0)
	// Debuffs are negative and weaken toward zero; Turn DMG is positive and weakens downward.
	const towardZero = $derived((selectedModifier?.baseMax ?? -1) > 0 ? -1 : 1)
	// The stored value's sign — shown OUTSIDE the input so the box only ever holds the
	// magnitude (typing "-" mid-edit used to parse as 0 and snap back to the bound).
	const sign = $derived(towardZero === 1 ? -1 : 1)

	// The range of CURRENT values reachable at this exorcision level: worst case keeps
	// the strongest base roll with minimum reductions, best case the weakest base roll
	// with maximum reductions.
	const currentBounds = $derived.by(() => {
		if (!selectedModifier) return { min: -999, max: 999 }
		const lo = (selectedModifier.baseMin ?? 0) + towardZero * reductions * step
		const hi = (selectedModifier.baseMax ?? 0) + towardZero * reductions * step * 3
		return { min: Math.min(lo, hi), max: Math.max(lo, hi) }
	})
	// The same bounds as positive magnitudes, for the unsigned input. Without a
	// reduction step (API not yet serving it) the level-aware lower bound can't be
	// computed — fall back to accepting any magnitude below the base maximum rather
	// than wrongly clamping to the Lvl 1 range.
	const magnitudeBounds = $derived.by(() => {
		const lo = Math.min(Math.abs(currentBounds.min), Math.abs(currentBounds.max))
		const hi = Math.max(Math.abs(currentBounds.min), Math.abs(currentBounds.max))
		return step > 0 ? { min: lo, max: hi } : { min: 0, max: hi }
	})

	// With no level-ups the current value IS the base roll; past that, the base can
	// only be bounded (each of the `reductions` rolls was 1-3 steps).
	const impliedBaseRange = $derived.by(() => {
		if (!selectedModifier || reductions === 0 || !strength) return null
		const a = strength - towardZero * reductions * step
		const b = strength - towardZero * reductions * step * 3
		const min = Math.max(Math.min(a, b), selectedModifier.baseMin ?? -999)
		const max = Math.min(Math.max(a, b), selectedModifier.baseMax ?? 999)
		return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 }
	})

	// Build befoulment options
	const befoulmentOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [
			{ value: '', label: m.befoulment_none() }
		]

		for (const bef of befoulmentQuery.data ?? []) {
			items.push({
				value: bef.id,
				label: locale === 'ja' ? bef.nameJp : bef.nameEn
			})
		}

		return items
	})

	// Exorcism level options (1 to maxExorcismLevel, fallback to 5 — weapons start at 1)
	const exorcismOptions = $derived.by(() => {
		const max = maxExorcismLevel ?? 5
		return Array.from({ length: max }, (_, i) => ({
			value: i + 1,
			label: m.befoulment_level({ level: String(i + 1) })
		}))
	})

	// Get suffix for display
	function getSuffix(modifier: WeaponStatModifier | undefined): string {
		return modifier?.suffix ?? ''
	}

	function clamp(val: number, min: number, max: number): number {
		return Math.min(Math.max(val, min), max)
	}

	function handleModifierChange(value: string | undefined) {
		const modifier = value ? (befoulmentQuery.data ?? []).find((m) => m.id === value) : undefined
		if (!modifier) {
			currentBefoulment = null
			return
		}
		currentBefoulment = {
			modifier,
			strength: currentBefoulment?.strength ?? 0,
			permeation: currentBefoulment?.permeation ?? 1,
			exorcismLevel: Math.max(currentBefoulment?.exorcismLevel ?? 1, 1)
		}
	}

	// While typing: track the value without rewriting the box (rewriting mid-edit made
	// it impossible to delete and retype). Clamp and normalize only on blur.
	function handleStrengthInput(event: Event) {
		const input = event.target as HTMLInputElement
		const magnitude = parseFloat(input.value)
		if (Number.isNaN(magnitude) || !currentBefoulment) return
		currentBefoulment = { ...currentBefoulment, strength: sign * Math.abs(magnitude) }
	}

	function handleStrengthBlur(event: Event) {
		const input = event.target as HTMLInputElement
		const magnitude = Math.abs(parseFloat(input.value) || 0)
		const clamped = clamp(magnitude, magnitudeBounds.min, magnitudeBounds.max)
		input.value = String(clamped)
		if (currentBefoulment) {
			currentBefoulment = { ...currentBefoulment, strength: sign * clamped }
		}
	}

	// Permeation (深度): the game's 1-6 severity depth of the base roll. 1 = weakest
	// befoulment, 6 = strongest. Every befouled weapon has one, so it defaults to 1.
	const permeationOptions = Array.from({ length: 6 }, (_, i) => ({
		value: i + 1,
		label: String(i + 1)
	}))

	function handlePermeationChange(value: number | undefined) {
		if (!currentBefoulment) return
		currentBefoulment = { ...currentBefoulment, permeation: value ?? 1 }
	}

	function handleExorcismChange(value: number | undefined) {
		if (!currentBefoulment) return
		const level = Math.max(value ?? 1, 1)
		if (step <= 0) {
			currentBefoulment = { ...currentBefoulment, exorcismLevel: level }
			return
		}
		// Re-clamp the current value into the new level's reachable range
		const r = Math.max(level - 1, 0)
		const lo = (selectedModifier?.baseMin ?? 0) + towardZero * r * step
		const hi = (selectedModifier?.baseMax ?? 0) + towardZero * r * step * 3
		const bounds = { min: Math.min(lo, hi), max: Math.max(lo, hi) }
		const clamped = clamp(currentBefoulment.strength ?? 0, bounds.min, bounds.max)
		currentBefoulment = { ...currentBefoulment, exorcismLevel: level, strength: clamped }
	}
</script>

{#if befoulmentQuery.isPending}
	<div class="befoulment-select loading">
		<div class="skeleton"></div>
	</div>
{:else if befoulmentQuery.error}
	<div class="befoulment-select">
		<div class="error">{m.sidebar_keys_error()}</div>
	</div>
{:else}
	<div class="befoulment-select">
		<!-- Befoulment Type + current in-game value -->
		<div class="skill-row">
			<div class="skill-fields">
				<div class="skill-select">
					<Select
						options={befoulmentOptions}
						value={selectedModifierId}
						onValueChange={handleModifierChange}
						placeholder={m.placeholder_select_befoulment()}
						size="medium"
						fullWidth
						contained
					/>
				</div>

				{#if selectedModifier}
					<div class="skill-value-group">
						{#if sign < 0}
							<span class="sign">&minus;</span>
						{/if}
						<div class="skill-value-input">
							<Input
								type="number"
								min={magnitudeBounds.min}
								max={magnitudeBounds.max}
								step={0.1}
								value={strength ? Math.abs(strength) : ''}
								oninput={handleStrengthInput}
								onblur={handleStrengthBlur}
								contained
								variant="number"
								placeholder="{magnitudeBounds.min}~{magnitudeBounds.max}"
							/>
						</div>
						<span class="suffix">{getSuffix(selectedModifier) ?? ''}</span>
					</div>
				{/if}
			</div>
		</div>

		{#if selectedModifier}
			<!-- Exorcision Level -->
			<div class="skill-row">
				<div class="skill-fields">
					<div class="skill-select">
						<Select
							options={exorcismOptions}
							value={exorcismLevel}
							onValueChange={handleExorcismChange}
							size="medium"
							fullWidth
							contained
						/>
					</div>
				</div>
			</div>

			<!-- Permeation (深度): 1-6 severity depth of the base roll -->
			<div class="skill-row">
				<div class="skill-fields">
					<span class="field-label">{m.befoulment_permeation()}</span>
					<div class="skill-select permeation-select">
						<Select
							options={permeationOptions}
							value={permeation}
							onValueChange={handlePermeationChange}
							size="medium"
							fullWidth
							contained
						/>
					</div>
				</div>
				{#if impliedBaseRange}
					<span class="hint"
						>{m.befoulment_permeation_hint({
							min: String(impliedBaseRange.min),
							max: String(impliedBaseRange.max)
						})}</span
					>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.befoulment-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		&.loading {
			min-height: 80px;
		}
	}

	.skeleton {
		height: 40px;
		background: var(--placeholder-bg);
		border-radius: layout.$item-corner-small;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.skill-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.skill-fields {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
	}

	.skill-select {
		flex: 1;
		min-width: 0;
	}

	.field-label {
		flex: 1;
		min-width: 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.permeation-select {
		flex: 0 0 auto;
		width: 96px;
	}

	.skill-value-group {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.sign {
		color: var(--text-secondary);
		font-size: typography.$font-regular;
		margin-right: spacing.$unit-half;
	}

	.suffix {
		color: var(--text-secondary);
		font-size: typography.$font-small;
		min-width: 1.5em;
		text-align: right;
	}

	.hint {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.error {
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-error);
	}
</style>
