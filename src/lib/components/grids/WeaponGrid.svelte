
<script lang="ts">
	import type { GridWeapon, GuidebookList } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { getDragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		weapons?: GridWeapon[]
		raidExtra?: boolean
		showGuidebooks?: boolean
		guidebooks?: GuidebookList
		canEdit?: boolean
		onClickGuidebookSlot?: (position: number) => void
		onRemoveGuidebook?: (position: number) => void
		collectionWeaponItems?: Map<string, { uncapLevel: number; transcendenceStep: number }[]>
	}

	let {
		weapons = [],
		raidExtra = undefined,
		showGuidebooks = undefined,
		guidebooks = undefined,
		canEdit = false,
		onClickGuidebookSlot = undefined,
		onRemoveGuidebook = undefined,
		collectionWeaponItems = undefined
	}: Props = $props()

	import WeaponUnit from '$lib/components/units/WeaponUnit.svelte'
	import ExtraContainer from '$lib/components/extra/ExtraContainer.svelte'
	import ExtraWeapons from '$lib/components/extra/ExtraWeaponsGrid.svelte'
	import Guidebooks from '$lib/components/extra/GuidebooksGrid.svelte'

	const ctx = usePartyContext()
	const dragContext = getDragDropContext()

	let mainhand = $derived(weapons.find((w) => (w as any).mainhand || w.position === -1))

	// Create array for sub-weapons (positions 0-8)
	let subWeaponSlots = $derived.by(() => {
		const slots: (GridWeapon | undefined)[] = Array(9).fill(undefined)
		weapons.forEach(weapon => {
			if (weapon.position >= 0 && weapon.position < 9) {
				slots[weapon.position] = weapon
			}
		})
		return slots
	})

	// Compute per-position collection status by consuming items in render order.
	// A collection item matches if its uncap/transcendence meets or exceeds the grid item's.
	const collectionStatus = $derived.by(() => {
		if (!collectionWeaponItems) return null
		const remaining = new Map(Array.from(collectionWeaponItems, ([k, v]) => [k, [...v]]))
		const status = new Map<number, boolean>()

		const check = (weapon: GridWeapon | undefined, position: number) => {
			const gid = weapon?.weapon?.granblueId
			if (!gid) { status.set(position, false); return }
			const key = String(gid)
			const items = remaining.get(key)
			if (!items) { status.set(position, false); return }
			const needed = { uncap: weapon.uncapLevel ?? 0, trans: weapon.transcendenceStep ?? 0 }
			const idx = items.findIndex(c => c.uncapLevel >= needed.uncap && c.transcendenceStep >= needed.trans)
			if (idx >= 0) {
				items.splice(idx, 1)
				status.set(position, true)
			} else {
				status.set(position, false)
			}
		}

		check(mainhand, -1)
		subWeaponSlots.forEach((w, i) => check(w, i))
		return status
	})
</script>

<div class="wrapper">
	<div class="grid">
		<div aria-label="Mainhand Weapon">
			<WeaponUnit item={mainhand} position={-1} notInCollection={collectionStatus != null && !!mainhand?.weapon?.granblueId && !collectionStatus.get(-1)} inCollection={collectionStatus != null && !!mainhand?.weapon?.granblueId && !!collectionStatus.get(-1)} />
		</div>

		<ul class="weapons" aria-label="Weapon Grid">
			{#each subWeaponSlots as weapon, i}
				<li
					aria-label={weapon ? `Weapon ${i}` : `Empty slot ${i}`}
					data-index={i}
					class={weapon ? '' : 'Empty'}
				>
					{#if dragContext}
						<DropZone
							container="main-weapons"
							position={i}
							type="weapon"
							item={weapon}
							canDrop={ctx?.canEdit() ?? false}
						>
							<DraggableItem
								item={weapon}
								container="main-weapons"
								position={i}
								type="weapon"
								canDrag={!!weapon && (ctx?.canEdit() ?? false)}
							>
								<WeaponUnit item={weapon} position={i} notInCollection={collectionStatus != null && !!weapon?.weapon?.granblueId && !collectionStatus.get(i)} inCollection={collectionStatus != null && !!weapon?.weapon?.granblueId && !!collectionStatus.get(i)} />
							</DraggableItem>
						</DropZone>
					{:else}
						<WeaponUnit item={weapon} position={i} notInCollection={collectionStatus != null && !!weapon?.weapon?.granblueId && !collectionStatus.get(i)} inCollection={collectionStatus != null && !!weapon?.weapon?.granblueId && !!collectionStatus.get(i)} />
					{/if}
				</li>
			{/each}
		</ul>
	</div>
	{#if raidExtra || showGuidebooks}
		<ExtraContainer>
			{#if raidExtra}
				<ExtraWeapons {weapons} offset={9} />
			{/if}
			{#if showGuidebooks}
				<Guidebooks {guidebooks} {canEdit} onClickSlot={onClickGuidebookSlot} onRemove={onRemoveGuidebook} />
			{/if}
		</ExtraContainer>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/layout' as layout;

	.wrapper {
		align-items: center;
		display: flex;
		flex-direction: column;
		justify-content: center;

		@include breakpoint(phone) {
			margin: 0 2px;
		}

		.grid {
			display: grid;
			gap: $unit-3x;
			grid-template-columns: 1.278fr 3fr;
			justify-items: center;
			grid-template-areas: 'mainhand grid';
			max-width: $grid-width;

			@include breakpoint(tablet) {
				gap: $unit-2x;
			}

			@include breakpoint(phone) {
				gap: $unit;
			}

			.weapons {
				display: grid; /* make the right-images container a grid */
				grid-template-columns: repeat(
					3,
					minmax(0, 1fr)
				); /* create 3 columns, each taking up 1 fraction */
				grid-template-rows: repeat(3, 1fr); /* create 3 rows, each taking up 1 fraction */
				gap: $unit-3x;

				@include breakpoint(tablet) {
					gap: $unit-2x;
				}

				@include breakpoint(phone) {
					gap: $unit;
				}

				& > li {
					list-style: none;
				}
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
