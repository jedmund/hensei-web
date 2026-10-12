<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { SvelteMap } from 'svelte/reactivity'
	import { usePartyContext } from '$lib/types/party-context'
	import { getDragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		characters?: GridCharacter[] | undefined
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
		gender?: number
		container?: string | undefined
		unlimited?: boolean
		collectionCharacterItems?: Map<string, { uncapLevel: number; transcendenceStep: number }[]>
	}

	let {
		characters = [],
		mainWeaponElement = undefined,
		partyElement = undefined,
		gender = 0,
		container = 'main-characters',
		unlimited = false,
		collectionCharacterItems = undefined
	}: Props = $props()

	import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'
	import BroughtByBlessing from '$lib/components/solomonis/grid/BroughtByBlessing.svelte'
	import {
		canMarkBroughtByBlessing,
		characterSlotCount,
		getExpedition
	} from '$lib/components/solomonis/grid/seal'

	const ctx = usePartyContext()
	const dragContext = getDragDropContext()

	// Evoking Solomonis limits characters: builds hold the route Evoker (+1
	// with The Hanged Man), runs the route Evoker and up to 4 allies.
	const expedition = $derived(getExpedition(ctx?.getParty()))

	// Dynamic slot count based on unlimited flag
	const slotCount = $derived(
		expedition ? characterSlotCount(expedition, characters) : unlimited ? 8 : 5
	)

	// Create array with proper empty slots
	let characterSlots = $derived.by(() => {
		const slots: (GridCharacter | undefined)[] = Array(slotCount).fill(undefined)
		characters.forEach((char) => {
			if (char.position >= 0 && char.position < slotCount) {
				slots[char.position] = char
			}
		})
		return slots
	})

	// Compute per-position collection status by consuming items in render order.
	// A collection item matches if its uncap/transcendence meets or exceeds the grid item's.
	const collectionStatus = $derived.by(() => {
		if (!collectionCharacterItems) return null
		const remaining = new Map(Array.from(collectionCharacterItems, ([k, v]) => [k, [...v]]))
		const status = new SvelteMap<number, boolean>()

		characterSlots.forEach((char, i) => {
			const gid = char?.character?.granblueId
			if (!gid) {
				status.set(i, false)
				return
			}
			const key = String(gid)
			const items = remaining.get(key)
			if (!items) {
				status.set(i, false)
				return
			}
			const needed = { uncap: char.uncapLevel ?? 0, trans: char.transcendenceStep ?? 0 }
			const idx = items.findIndex(
				(c) => c.uncapLevel >= needed.uncap && c.transcendenceStep >= needed.trans
			)
			if (idx >= 0) {
				items.splice(idx, 1)
				status.set(i, true)
			} else {
				status.set(i, false)
			}
		})
		return status
	})
</script>

{#snippet solomonisAlly(character: GridCharacter | undefined)}
	{#if expedition?.kind === 'run' && character}
		<BroughtByBlessing
			{character}
			allowed={canMarkBroughtByBlessing(expedition, characters, character)}
		/>
	{/if}
{/snippet}

<div class="wrapper">
	<ul class="characters" class:unlimited class:limited={slotCount < 5} aria-label="Character Grid">
		{#each characterSlots as character, i (i)}
			<li aria-label={`Character slot ${i}`} class:Empty={!character}>
				{#if dragContext}
					<DropZone
						{container}
						position={i}
						type="character"
						item={character}
						canDrop={ctx?.canEdit() ?? false}
					>
						<DraggableItem
							item={character}
							{container}
							position={i}
							type="character"
							canDrag={!!character && (ctx?.canEdit() ?? false)}
						>
							<CharacterUnit
								item={character}
								position={i}
								{mainWeaponElement}
								{partyElement}
								{gender}
								notInCollection={collectionStatus != null &&
									!!character?.character?.granblueId &&
									!collectionStatus.get(i)}
								inCollection={collectionStatus != null &&
									!!character?.character?.granblueId &&
									!!collectionStatus.get(i)}
							/>
						</DraggableItem>
					</DropZone>
					{@render solomonisAlly(character)}
				{:else}
					<CharacterUnit
						item={character}
						position={i}
						{mainWeaponElement}
						{partyElement}
						notInCollection={collectionStatus != null &&
							!!character?.character?.granblueId &&
							!collectionStatus.get(i)}
						inCollection={collectionStatus != null &&
							!!character?.character?.granblueId &&
							!!collectionStatus.get(i)}
					/>
					{@render solomonisAlly(character)}
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as layout;

	.characters {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: $unit-3x;

		@media (max-width: 768px) {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: $unit-3x $unit;

			& > li {
				width: calc((100% - $unit * 2) / 3);
			}
		}

		&.unlimited {
			// Use flexbox to center the partial second row
			display: flex;
			flex-wrap: wrap;
			justify-content: center;

			// 6 units must fit in space of 5
			& > li {
				width: 116px;
			}

			@media (max-width: 768px) {
				gap: $unit-3x $unit;

				& > li {
					width: calc((100% - $unit * 2) / 3);
				}
			}
		}

		// Solomonis builds hold 1–2 characters: keep the usual slot width, centred
		&.limited {
			display: flex;
			justify-content: center;

			& > li {
				width: calc((100% - #{$unit-3x} * 4) / 5);
			}

			@media (max-width: 768px) {
				& > li {
					width: calc((100% - #{$unit} * 2) / 3);
				}
			}
		}

		& > li {
			list-style: none;
		}
	}
</style>
