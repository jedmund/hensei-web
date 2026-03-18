
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

	let { currentBefoulment = $bindable<Befoulment | null>(null), locale = 'en', maxExorcismLevel = null }: Props = $props()

	const befoulmentQuery = createQuery(() => entityQueries.befoulments())

	// Derive display values directly from the bound prop
	const selectedModifierId = $derived(currentBefoulment?.modifier?.id ?? '')
	const strength = $derived(currentBefoulment?.strength ?? 0)
	const exorcismLevel = $derived(currentBefoulment?.exorcismLevel ?? 0)

	// Get selected modifier from query data
	const selectedModifier = $derived(
		selectedModifierId
			? (befoulmentQuery.data ?? []).find((m) => m.id === selectedModifierId)
			: undefined
	)

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

	// Exorcism level options (0 to maxExorcismLevel, fallback to 5)
	const exorcismOptions = $derived.by(() => {
		const max = maxExorcismLevel ?? 5
		return Array.from({ length: max + 1 }, (_, i) => ({
			value: i,
			label: m.befoulment_level({ level: String(i) })
		}))
	})

	// Get suffix for display
	function getSuffix(modifier: WeaponStatModifier | undefined): string {
		return modifier?.suffix ?? ''
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
			exorcismLevel: currentBefoulment?.exorcismLevel ?? 0
		}
	}

	function handleStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		const val = parseFloat(input.value) || 0
		const max = selectedModifier?.baseMax ?? 999
		const clamped = Math.min(val, max)
		if (val > max) input.value = String(clamped)
		if (currentBefoulment) {
			currentBefoulment = { ...currentBefoulment, strength: clamped }
		}
	}

	function handleExorcismChange(value: number | undefined) {
		if (currentBefoulment) {
			currentBefoulment = { ...currentBefoulment, exorcismLevel: value ?? 0 }
		}
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
		<!-- Befoulment Type + Strength -->
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
						<div class="skill-value-input">
							<Input
								type="number"
								min={selectedModifier.baseMin}
								max={selectedModifier.baseMax}
								step={0.5}
								value={strength || ''}
								oninput={handleStrengthChange}
								contained
								variant="number"
								placeholder="{selectedModifier.baseMin}~{selectedModifier.baseMax}"
							/>
						</div>
						<span class="suffix">{getSuffix(selectedModifier) ?? ''}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Exorcism Level -->
		{#if selectedModifier}
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

	.skill-value-group {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.suffix {
		color: var(--text-secondary);
		font-size: typography.$font-small;
		min-width: 1.5em;
		text-align: right;
	}

	.error {
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-error);
	}
</style>
