<script lang="ts">
	/**
	 * WonderStateFields - the controls a Wonder's kind has: an uncap stepper
	 * (Seals; lowering it caps the level), a level stepper (Seals and Yupei)
	 * and the recruited-character count (Symbolum). Fixed Wonders have none.
	 * Shared by the collection edit pane and the team's Wonders pane.
	 */
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Stepper from '$lib/components/ui/Stepper.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import { maxEvolutionFor, maxLevelFor, normalizeState } from '$lib/features/wonders/wonders'
	import type { Wonder, WonderState } from '$lib/types/api/wonder'

	interface Props {
		wonder: Wonder
		state: WonderState
		onChange: (state: WonderState) => void
	}

	let { wonder, state, onChange }: Props = $props()

	const maxEvolution = $derived(maxEvolutionFor(wonder))
	const maxLevel = $derived(maxLevelFor(wonder, state.evolution))

	function update(changes: Partial<WonderState>) {
		onChange(normalizeState(wonder, { ...state, ...changes }))
	}

	function handlePossession(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value
		const count = Number.parseInt(raw, 10)
		update({ possession: Number.isFinite(count) ? count : 0 })
	}
</script>

{#if wonder.kind === 'leveled'}
	{#if maxEvolution > 0}
		<DetailRow label={m.wonders_uncap_label()} compact>
			<Stepper
				value={state.evolution ?? 0}
				max={maxEvolution}
				onChange={(evolution) => update({ evolution })}
				format={(evolution) => m.wonders_uncap_value({ evolution, max: maxEvolution })}
				size="medium"
				label={m.wonders_uncap_label()}
				decreaseLabel={m.wonders_uncap_down()}
				increaseLabel={m.wonders_uncap_up()}
			/>
		</DetailRow>
	{/if}
	<DetailRow label={m.wonders_level_label()} compact>
		<Stepper
			value={state.level ?? 1}
			min={1}
			max={maxLevel}
			onChange={(level) => update({ level })}
			format={(level) => m.wonders_level({ level })}
			size="medium"
			label={m.wonders_level_label()}
			decreaseLabel={m.wonders_level_down()}
			increaseLabel={m.wonders_level_up()}
		/>
	</DetailRow>
{:else if wonder.kind === 'scaling'}
	<DetailRow label={m.wonders_recruited_label()} compact>
		<Input
			type="number"
			inputmode="numeric"
			min="0"
			step="1"
			size="medium"
			contained
			alignRight
			value={String(state.possession ?? 0)}
			aria-label={m.wonders_recruited_label()}
			oninput={handlePossession}
		/>
	</DetailRow>
	<p class="hint">{m.wonders_recruited_hint()}</p>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
