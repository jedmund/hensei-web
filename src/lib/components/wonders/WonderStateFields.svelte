<script lang="ts">
	/**
	 * WonderStateFields - the controls a Wonder's kind has: uncap stars
	 * (Seals; lowering the uncap caps the level), a level slider with a number
	 * field (Seals and Yupei) and the recruited-character count (Symbolum).
	 * Fixed Wonders have none.
	 * Used by WonderSetupPane, for the collection and a team's Wonders.
	 */
	import { m } from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Slider from '$lib/components/ui/Slider.svelte'
	import UncapStar from '$lib/components/uncap/UncapStar.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import {
		maxEvolutionFor,
		maxLevelFor,
		normalizeState,
		symbolumRecruitsUntilNext
	} from '$lib/features/wonders/wonders'
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

	// Same as UncapIndicator: tapping an empty star fills up to it, tapping a
	// filled one empties from it
	function handleStar(index: number, empty: boolean) {
		update({ evolution: empty ? index + 1 : index })
	}

	// Committed on change (blur or Enter) so typing "1" on the way to "15"
	// doesn't clamp mid-entry; normalizeState clamps to the uncap's cap
	function handleLevelInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement
		const level = Number.parseInt(input.value, 10)
		if (Number.isFinite(level)) update({ level })
		else input.value = String(state.level ?? 1)
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
			<ul class="stars" aria-label={m.wonders_uncap_label()}>
				{#each Array.from({ length: maxEvolution }, (_, i) => i) as i (i)}
					<UncapStar
						index={i}
						empty={i >= (state.evolution ?? 0)}
						editable
						onStarClick={handleStar}
					/>
				{/each}
			</ul>
		</DetailRow>
	{/if}
	<DetailRow label={m.wonders_level_label()} compact>
		<div class="level">
			<div class="level-slider">
				<Slider
					value={state.level ?? 1}
					min={1}
					max={maxLevel}
					step={1}
					onValueChange={(level) => update({ level })}
				/>
			</div>
			<div class="level-input">
				<Input
					type="number"
					inputmode="numeric"
					min="1"
					max={String(maxLevel)}
					step="1"
					size="medium"
					contained
					alignRight
					value={String(state.level ?? 1)}
					aria-label={m.wonders_level_label()}
					onchange={handleLevelInput}
				/>
			</div>
		</div>
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
	{@const untilNext = symbolumRecruitsUntilNext(state.possession)}
	{#if untilNext !== null}
		<DetailRow
			label={m.wonders_recruits_until_next()}
			value={m.wonders_recruits_until_next_value({ count: untilNext })}
		/>
	{/if}
	<p class="hint">{m.wonders_recruited_hint()}</p>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.stars {
		display: flex;
		gap: $unit-fourth;
		list-style: none;
		margin: 0;
		padding: 0;
		align-items: center;
	}

	.level {
		display: flex;
		align-items: center;
		gap: $unit-2x;
	}

	// Room to drag rather than a sliver in the row's value cell
	.level-slider {
		width: 160px;
		display: flex;
		align-items: center;
	}

	.level-input {
		width: 64px;
	}

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
