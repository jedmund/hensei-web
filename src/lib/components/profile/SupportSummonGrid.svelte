<script lang="ts">
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getSummonImage, getSummonTransformation, getPlaceholderImage } from '$lib/utils/images'
	import {
		SUPPORT_SUMMON_SECTIONS,
		SUPPORT_SUMMON_SECTION_LIMITS,
		type SupportSummon,
		type SupportSummonSection
	} from '$lib/types/api/supportSummon'

	interface Props {
		/** Support-summon slots returned by the API. Order doesn't matter — we
		 * key by `section`+`position` and lay them into the 7×4 grid. */
		summons?: SupportSummon[]
	}

	let { summons = [] }: Props = $props()

	// Largest position across element sections (3 cells) plus misc's extra slot (4).
	const COLUMNS = 4

	const bySlot = $derived.by(() => {
		const map: Record<string, SupportSummon> = {}
		for (const s of summons) {
			map[`${s.section}:${s.position}`] = s
		}
		return map
	})

	// Flatten into 28 cells (7 rows × 4 cols). Cells beyond a section's limit
	// render as invisible spacers so each row keeps the same column count.
	type Cell =
		| { kind: 'slot'; section: SupportSummonSection; position: number; summon?: SupportSummon }
		| { kind: 'spacer'; section: SupportSummonSection; position: number }

	const cells = $derived.by<Cell[]>(() => {
		const out: Cell[] = []
		for (const section of SUPPORT_SUMMON_SECTIONS) {
			const limit = SUPPORT_SUMMON_SECTION_LIMITS[section]
			for (let position = 0; position < COLUMNS; position++) {
				if (position < limit) {
					out.push({
						kind: 'slot',
						section,
						position,
						summon: bySlot[`${section}:${position}`]
					})
				} else {
					out.push({ kind: 'spacer', section, position })
				}
			}
		}
		return out
	})

	function imageFor(summon: SupportSummon | undefined): string {
		if (!summon) return getPlaceholderImage('summon', 'main')
		const cs = summon.collectionSummon
		const transformation = getSummonTransformation(
			cs.summon?.granblueId,
			cs.uncapLevel,
			cs.transcendenceStep
		)
		return getSummonImage(cs.summon?.granblueId, 'main', transformation)
	}
</script>

<div class="support-summon-grid" role="grid" aria-label="Support summons">
	{#each cells as cell (`${cell.section}:${cell.position}`)}
		{#if cell.kind === 'spacer'}
			<div class="cell spacer" aria-hidden="true"></div>
		{:else}
			<div class="cell" role="gridcell">
				<div class="image-wrap">
					{#if cell.summon}
						<img
							class="image"
							src={imageFor(cell.summon)}
							alt={cell.summon.collectionSummon.summon?.name?.en ?? ''}
							loading="lazy"
						/>
					{:else}
						<div class="image empty" aria-hidden="true"></div>
					{/if}
				</div>
				<UncapIndicator
					type="summon"
					uncapLevel={cell.summon?.collectionSummon.uncapLevel ?? 0}
					transcendenceStage={cell.summon?.collectionSummon.transcendenceStep ?? 0}
					flb={cell.summon?.collectionSummon.summon?.uncap?.flb ?? false}
					ulb={cell.summon?.collectionSummon.summon?.uncap?.ulb ?? false}
					transcendence={cell.summon?.collectionSummon.summon?.uncap?.transcendence ?? false}
					size="small"
				/>
			</div>
		{/if}
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.support-summon-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: auto;
		gap: $unit;
		width: 100%;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		min-width: 0;

		&.spacer {
			visibility: hidden;
		}
	}

	.image-wrap {
		width: 100%;
		aspect-ratio: 144 / 140; // matches summon-main artwork
		border-radius: $card-corner;
		overflow: hidden;
		background: var(--placeholder-bg, rgba(0, 0, 0, 0.05));
	}

	.image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;

		&.empty {
			background: transparent;
		}
	}
</style>
