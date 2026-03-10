
<script lang="ts">
	import type { GridSummon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { getDragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		summons?: GridSummon[]
		collectionSummonItems?: Map<string, { uncapLevel: number; transcendenceStep: number }[]>
	}

	let { summons = [], collectionSummonItems = undefined }: Props = $props()

	import SummonUnit from '$lib/components/units/SummonUnit.svelte'
	import ExtraSummons from '$lib/components/extra/ExtraSummonsGrid.svelte'

	const ctx = usePartyContext()
	const dragContext = getDragDropContext()

	let main = $derived(summons.find((s) => s.position === -1) ?? summons.find((s) => s.main))
	let friend = $derived(summons.find((s) => s.position === 6) ?? summons.find((s) => s.friend))

	// Create array for sub-summons (positions 0-3)
	let subSummonSlots = $derived.by(() => {
		const slots: (GridSummon | undefined)[] = Array(4).fill(undefined)
		summons.forEach(summon => {
			if (summon.position >= 0 && summon.position < 4) {
				slots[summon.position] = summon
			}
		})
		return slots
	})

	// Compute per-position collection status by consuming items in render order.
	// A collection item matches if its uncap/transcendence meets or exceeds the grid item's.
	const collectionStatus = $derived.by(() => {
		if (!collectionSummonItems) return null
		const remaining = new Map(Array.from(collectionSummonItems, ([k, v]) => [k, [...v]]))
		const status = new Map<number, boolean>()

		const check = (summon: GridSummon | undefined, position: number) => {
			const gid = summon?.summon?.granblueId
			if (!gid) { status.set(position, false); return }
			const key = String(gid)
			const items = remaining.get(key)
			if (!items) { status.set(position, false); return }
			const needed = { uncap: summon.uncapLevel ?? 0, trans: summon.transcendenceStep ?? 0 }
			const idx = items.findIndex(c => c.uncapLevel >= needed.uncap && c.transcendenceStep >= needed.trans)
			if (idx >= 0) {
				items.splice(idx, 1)
				status.set(position, true)
			} else {
				status.set(position, false)
			}
		}

		check(main, -1)
		subSummonSlots.forEach((s, i) => check(s, i))
		check(friend, 6)
		return status
	})
</script>

<div class="wrapper">
	<div class="grid">
		<div class="LabeledUnit">
			<SummonUnit item={main} position={-1} notInCollection={collectionStatus != null && !!main?.summon?.granblueId && !collectionStatus.get(-1)} inCollection={collectionStatus != null && !!main?.summon?.granblueId && !!collectionStatus.get(-1)} />
		</div>

		<section>
			<ul class="summons">
				{#each subSummonSlots as summon, i}
					<li
						aria-label={`Summon slot ${i}`}
						class:Empty={!summon}
					>
						{#if dragContext}
							<DropZone
								container="main-summons"
								position={i}
								type="summon"
								item={summon}
								canDrop={ctx?.canEdit() ?? false}
							>
								<DraggableItem
									item={summon}
									container="main-summons"
									position={i}
									type="summon"
									canDrag={!!summon && (ctx?.canEdit() ?? false)}
								>
									<SummonUnit item={summon} position={i} notInCollection={collectionStatus != null && !!summon?.summon?.granblueId && !collectionStatus.get(i)} inCollection={collectionStatus != null && !!summon?.summon?.granblueId && !!collectionStatus.get(i)} />
								</DraggableItem>
							</DropZone>
						{:else}
							<SummonUnit item={summon} position={i} notInCollection={collectionStatus != null && !!summon?.summon?.granblueId && !collectionStatus.get(i)} inCollection={collectionStatus != null && !!summon?.summon?.granblueId && !!collectionStatus.get(i)} />
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<div class="LabeledUnit">
			<SummonUnit item={friend} position={6} notInCollection={collectionStatus != null && !!friend?.summon?.granblueId && !collectionStatus.get(6)} inCollection={collectionStatus != null && !!friend?.summon?.granblueId && !!collectionStatus.get(6)} />
		</div>
	</div>
	<ExtraSummons {summons} offset={4} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/layout' as layout;

	.grid {
		display: grid;
		grid-template-columns: 1.17fr 2fr 1.17fr;
		gap: $unit-3x;
		justify-content: center;
		align-items: stretch;
		margin: 0 auto;
		max-width: $grid-width;

		@include breakpoint(tablet) {
			gap: $unit-2x;
		}

		@include breakpoint(phone) {
			gap: $unit;
		}

		.summons {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: repeat(2, auto);
			align-content: space-between;
			column-gap: $unit-3x;
			height: 100%;

			@include breakpoint(tablet) {
				column-gap: $unit-2x;
			}

			@include breakpoint(phone) {
				column-gap: $unit;
			}

			& > li {
				list-style: none;
			}
		}
	}

	.unit {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
	}

	.image {
		width: 100%;
		height: auto;
		border: 1px solid $grey-75;
		border-radius: layout.$input-corner;
		display: block;
	}

	.name {
		font-size: $font-small;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
