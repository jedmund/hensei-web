<script lang="ts">
	import SupportSummonSlot from '$lib/components/profile/SupportSummonSlot.svelte'
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
	}

	let { summons = [], isOwner = false, onSelect }: Props = $props()

	const ELEMENT_SECTIONS: readonly SupportSummonSection[] = [
		'wind',
		'fire',
		'water',
		'earth',
		'dark',
		'light'
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

	const elementCells = $derived.by<Cell[]>(() => {
		const out: Cell[] = []
		for (const section of ELEMENT_SECTIONS) {
			const limit = SUPPORT_SUMMON_SECTION_LIMITS[section]
			for (let position = 0; position < limit; position++) {
				out.push({ section, position, summon: bySlot[`${section}:${position}`] })
			}
		}
		return out
	})

	const miscCells = $derived.by<Cell[]>(() => {
		const out: Cell[] = []
		const limit = SUPPORT_SUMMON_SECTION_LIMITS.misc
		for (let position = 0; position < limit; position++) {
			out.push({ section: 'misc', position, summon: bySlot[`misc:${position}`] })
		}
		return out
	})
</script>

<div class="support-summon-grid" role="grid" aria-label="Support summons">
	<div class="element-grid">
		{#each elementCells as cell (`${cell.section}:${cell.position}`)}
			<SupportSummonSlot
				section={cell.section}
				position={cell.position}
				summon={cell.summon}
				{isOwner}
				{onSelect}
			/>
		{/each}
	</div>
	<div class="misc-column" role="row">
		{#each miscCells as cell (`${cell.section}:${cell.position}`)}
			<SupportSummonSlot
				section={cell.section}
				position={cell.position}
				summon={cell.summon}
				{isOwner}
				{onSelect}
			/>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

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
		grid-template-columns: minmax(0, 6fr) minmax(0, 1.05fr);
		gap: $unit;
		width: 100%;
	}

	.element-grid {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		grid-template-rows: repeat(3, auto);
		grid-auto-flow: column;
		gap: $unit;
	}

	.misc-column {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}
</style>
