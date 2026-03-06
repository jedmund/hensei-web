<svelte:options runes={true} />

<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import type { PartyContext } from '$lib/types/party-context'
	import type { DragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		characters?: GridCharacter[] | undefined
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
		container?: string | undefined
		unlimited?: boolean
		collectionCharacterIds?: Set<string>
	}

	let {
		characters = [],
		mainWeaponElement = undefined,
		partyElement = undefined,
		container = 'main-characters',
		unlimited = false,
		collectionCharacterIds = undefined
	}: Props = $props()

	// Dynamic slot count based on unlimited flag
	const slotCount = $derived(unlimited ? 8 : 5)

	import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'

	const ctx = getContext<PartyContext>('party')
	const dragContext = getContext<DragDropContext | undefined>('drag-drop')

	// Create array with proper empty slots
	let characterSlots = $derived.by(() => {
		const slots: (GridCharacter | undefined)[] = Array(slotCount).fill(undefined)
		characters.forEach(char => {
			if (char.position >= 0 && char.position < slotCount) {
				slots[char.position] = char
			}
		})
		return slots
	})
</script>

<div class="wrapper">
	<ul
		class="characters"
		class:unlimited
		aria-label="Character Grid"
	>
		{#each characterSlots as character, i}
			<li
				aria-label={`Character slot ${i}`}
				class:Empty={!character}
			>
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
								notInCollection={collectionCharacterIds != null && !!character?.character?.granblueId && !collectionCharacterIds.has(String(character.character.granblueId))}
							/>
						</DraggableItem>
					</DropZone>
				{:else}
					<CharacterUnit
						item={character}
						position={i}
						{mainWeaponElement}
						{partyElement}
						notInCollection={collectionCharacterIds != null && !!character?.character?.granblueId && !collectionCharacterIds.has(String(character.character.granblueId))}
					/>
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

		&.unlimited {
			// Use flexbox to center the partial second row
			display: flex;
			flex-wrap: wrap;
			justify-content: center;

			// 6 units must fit in space of 5
			& > li {
				width: 116px;
			}
		}

		& > li {
			list-style: none;
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
