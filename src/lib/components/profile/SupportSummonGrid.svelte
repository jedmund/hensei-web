<script lang="ts">
	import SupportSummonSlot from '$lib/components/profile/SupportSummonSlot.svelte'
	import { getElementImage, getElementLabel } from '$lib/utils/element'
	import * as m from '$lib/paraglide/messages'
	import {
		SUPPORT_SUMMON_SECTION_LIMITS,
		type SupportSummon,
		type SupportSummonSection
	} from '$lib/types/api/supportSummon'

	interface Props {
		/** Support-summon slots returned by the API. Order doesn't matter — we
		 * key by `section`+`position` and lay them into the grid. */
		summons?: SupportSummon[]
		isOwner?: boolean
		onSelect?: ((section: SupportSummonSection, position: number) => void) | undefined
		onToggleRequired?: ((summon: SupportSummon) => void) | undefined
	}

	let { summons = [], isOwner = false, onSelect, onToggleRequired }: Props = $props()

	// GBF in-game element ordering for visual columns:
	// Fire → Water → Earth → Wind → Light → Dark
	// (Internal element ids: 2=fire, 3=water, 4=earth, 1=wind, 6=light, 5=dark.)
	const ELEMENT_COLUMNS: ReadonlyArray<{
		section: SupportSummonSection
		elementId: number
	}> = [
		{ section: 'fire', elementId: 2 },
		{ section: 'water', elementId: 3 },
		{ section: 'earth', elementId: 4 },
		{ section: 'wind', elementId: 1 },
		{ section: 'light', elementId: 6 },
		{ section: 'dark', elementId: 5 }
	] as const

	const bySlot = $derived.by(() => {
		const map: Record<string, SupportSummon> = {}
		for (const s of summons) {
			map[`${s.section}:${s.position}`] = s
		}
		return map
	})

	type Cell = {
		section: SupportSummonSection
		position: number
		summon?: SupportSummon
	}

	const miscPairs = $derived.by<Cell[][]>(() => {
		const cells: Cell[] = []
		const limit = SUPPORT_SUMMON_SECTION_LIMITS.misc
		for (let position = 0; position < limit; position++) {
			cells.push({ section: 'misc', position, summon: bySlot[`misc:${position}`] })
		}
		const pairs: Cell[][] = []
		for (let i = 0; i < cells.length; i += 2) {
			pairs.push(cells.slice(i, i + 2))
		}
		return pairs
	})
</script>

<div class="support-summon-grid" role="grid" aria-label="Support summons">
	<div class="element-columns">
		{#each ELEMENT_COLUMNS as { section, elementId } (section)}
			<div class="column">
				<div class="column-header">
					<img class="header-icon" src={getElementImage(elementId)} alt="" aria-hidden="true" />
					<span class="header-label">{getElementLabel(elementId)}</span>
				</div>
				{#each Array.from( { length: SUPPORT_SUMMON_SECTION_LIMITS[section] }, (_, position) => ({ section, position, summon: bySlot[`${section}:${position}`] }) ) as cell (`${cell.section}:${cell.position}`)}
					<SupportSummonSlot
						section={cell.section}
						position={cell.position}
						summon={cell.summon}
						{isOwner}
						{onSelect}
						{onToggleRequired}
					/>
				{/each}
			</div>
		{/each}
	</div>
	<div class="misc-column">
		<div class="column-header">
			<img class="header-icon" src={getElementImage(0)} alt="" aria-hidden="true" />
			<span class="header-label">{m.support_summon_section_misc()}</span>
		</div>
		{#each miscPairs as pair, pairIndex (pairIndex)}
			<div class="misc-pair">
				{#each pair as cell (`${cell.section}:${cell.position}`)}
					<SupportSummonSlot
						section={cell.section}
						position={cell.position}
						summon={cell.summon}
						{isOwner}
						{onSelect}
						{onToggleRequired}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.support-summon-grid {
		display: grid;
		// `minmax(0, …)` is required: without it the fr tracks have a
		// min-content floor at the misc image's intrinsic 184px width, and
		// decimal fr values silently collapse to the same layout.
		//
		// Element block holds 6 columns at 1fr each; misc col is 1.05fr so
		// it's slightly wider, sized so two stacked grid-variant misc images
		// (aspect 184/138) + the inter-cell gap roughly equal the height of
		// one main-variant element image (aspect 196/340).
		grid-template-columns: minmax(0, 6fr) minmax(0, 1.225fr);
		gap: $unit;
		width: 100%;
	}

	.element-columns {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: $unit;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		min-width: 0;
	}

	.misc-column {
		// Outer grid: header → pair → pair, with $unit-2x between sections so
		// the gap after the header and the gap between pairs both match the
		// element column's vertical rhythm.
		display: grid;
		grid-auto-rows: max-content;
		row-gap: $unit-2x;
		min-width: 0;
	}

	.misc-pair {
		// Inner grid: two stacked misc slots with the tighter $unit gap.
		display: grid;
		grid-auto-rows: max-content;
		row-gap: $unit;
		min-width: 0;
	}

	.column-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: $unit-half;
		padding-bottom: $unit-half;
	}

	.header-icon {
		// Match the label's text height ($font-small).
		width: 1em;
		height: 1em;
		font-size: $font-small;
		display: block;
		flex-shrink: 0;
	}

	.header-label {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
		text-align: center;
		line-height: 1;
	}
</style>
