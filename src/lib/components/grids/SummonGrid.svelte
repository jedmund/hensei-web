<svelte:options runes={true} />

<script lang="ts">
	import type { GridSummon } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import type { PartyContext } from '$lib/types/party-context'
	import type { DragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		summons?: GridSummon[]
		collectionSummonIds?: Set<string>
	}

	let { summons = [], collectionSummonIds = undefined }: Props = $props()

	import SummonUnit from '$lib/components/units/SummonUnit.svelte'
	import ExtraSummons from '$lib/components/extra/ExtraSummonsGrid.svelte'

	const ctx = getContext<PartyContext>('party')
	const dragContext = getContext<DragDropContext | undefined>('drag-drop')

	let main = $derived(summons.find((s) => s.main || s.position === -1))
	let friend = $derived(summons.find((s) => s.friend || s.position === 6))

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
</script>

<div class="wrapper">
	<div class="grid">
		<div class="LabeledUnit">
			<SummonUnit item={main} position={-1} notInCollection={collectionSummonIds != null && !!main?.summon?.granblueId && !collectionSummonIds.has(String(main.summon.granblueId))} />
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
									<SummonUnit item={summon} position={i} notInCollection={collectionSummonIds != null && !!summon?.summon?.granblueId && !collectionSummonIds.has(String(summon.summon.granblueId))} />
								</DraggableItem>
							</DropZone>
						{:else}
							<SummonUnit item={summon} position={i} notInCollection={collectionSummonIds != null && !!summon?.summon?.granblueId && !collectionSummonIds.has(String(summon.summon.granblueId))} />
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<div class="LabeledUnit">
			<SummonUnit item={friend} position={6} notInCollection={collectionSummonIds != null && !!friend?.summon?.granblueId && !collectionSummonIds.has(String(friend.summon.granblueId))} />
		</div>
	</div>
	<ExtraSummons {summons} offset={4} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/mixins' as *;

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
		border-radius: 8px;
		display: block;
	}

	.name {
		font-size: $font-small;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
