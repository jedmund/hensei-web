<svelte:options runes={true} />

<script lang="ts">
	import type { Befoulment, WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
	import { useWeaponStatModifiers } from '$lib/composables/useWeaponStatModifiers.svelte'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		/** Current befoulment on the weapon */
		currentBefoulment?: Befoulment | null
		/** Called when befoulment changes */
		onChange?: (befoulment: Befoulment | null) => void
		/** Language for display */
		locale?: 'en' | 'ja'
		/** Maximum exorcism level for this weapon (from weapon's maxExorcismLevel) */
		maxExorcismLevel?: number | null
	}

	let { currentBefoulment = null, onChange, locale = 'en', maxExorcismLevel = null }: Props = $props()

	const { befoulments, findBefoulment, isLoading } = useWeaponStatModifiers()

	// State
	let selectedModifierId = $state<string>(currentBefoulment?.modifier?.id ?? '')
	let strength = $state<number>(currentBefoulment?.strength ?? 0)
	let exorcismLevel = $state<number>(currentBefoulment?.exorcismLevel ?? 0)

	// Get selected modifier
	const selectedModifier = $derived(
		selectedModifierId ? findBefoulment(selectedModifierId) : undefined
	)

	// Build befoulment options
	const befoulmentOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [
			{ value: '', label: 'No befoulment' }
		]

		for (const bef of befoulments) {
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
			label: `Level ${i}`
		}))
	})

	// Get suffix for display
	function getSuffix(modifier: WeaponStatModifier | undefined): string {
		return modifier?.suffix ?? ''
	}

	// Handle befoulment type change
	function handleModifierChange(value: string | undefined) {
		selectedModifierId = value ?? ''
		if (!value) {
			strength = 0
			exorcismLevel = 0
		}
		emitChange()
	}

	// Handle strength change
	function handleStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		strength = parseFloat(input.value) || 0
		emitChange()
	}

	// Handle exorcism level change
	function handleExorcismChange(value: number | undefined) {
		exorcismLevel = value ?? 0
		emitChange()
	}

	// Emit change to parent
	function emitChange() {
		if (!selectedModifier) {
			onChange?.(null)
			return
		}

		onChange?.({
			modifier: selectedModifier,
			strength,
			exorcismLevel
		})
	}
</script>

{#if isLoading}
	<div class="befoulment-select loading">
		<div class="skeleton"></div>
	</div>
{:else}
	<div class="befoulment-select">
		<!-- Befoulment Type -->
		<div class="field-row">
			<label class="field-label">Befoulment Type</label>
			<Select
				options={befoulmentOptions}
				value={selectedModifierId}
				onValueChange={handleModifierChange}
				placeholder="Select befoulment"
				size="medium"
				fullWidth
				contained
			/>
		</div>

		{#if selectedModifier}
			<!-- Strength -->
			<div class="field-row">
				<label class="field-label">
					Strength
					{#if getSuffix(selectedModifier)}
						<span class="suffix">({getSuffix(selectedModifier)})</span>
					{/if}
				</label>
				<input
					type="number"
					class="strength-input"
					step="0.5"
					placeholder="Value"
					value={strength || ''}
					oninput={handleStrengthChange}
				/>
			</div>

			<!-- Exorcism Level -->
			<div class="field-row">
				<label class="field-label">Exorcism Level</label>
				<Select
					options={exorcismOptions}
					value={exorcismLevel}
					onValueChange={handleExorcismChange}
					size="medium"
					fullWidth
					contained
				/>
				<p class="help-text">Higher exorcism reduces the negative effect</p>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as colors;
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
		background: var(--skeleton-bg, colors.$grey-80);
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

	.field-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.field-label {
		font-size: typography.$font-small;
		font-weight: 500;
		color: var(--text-primary);

		.suffix {
			color: var(--text-secondary);
			font-weight: 400;
		}
	}

	.strength-input {
		width: 100%;
		max-width: 120px;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--input-bg, colors.$grey-85);
		border: 1px solid var(--border-secondary);
		border-radius: layout.$item-corner-small;
		color: var(--text-primary);
		font-size: typography.$font-regular;

		&:focus {
			outline: none;
			border-color: var(--accent-primary);
		}

		// Remove spin buttons
		-moz-appearance: textfield;
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	.help-text {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
