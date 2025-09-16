<svelte:options runes={true} />

<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import type { PartyContext } from '$lib/services/party.service'
	import type { DragDropContext } from '$lib/composables/drag-drop.svelte'
	import DraggableItem from '$lib/components/dnd/DraggableItem.svelte'
	import DropZone from '$lib/components/dnd/DropZone.svelte'

	interface Props {
		characters?: GridCharacter[]
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
		container?: string
	}

	let {
		characters = [],
		mainWeaponElement = undefined,
		partyElement = undefined,
		container = 'main-characters'
	}: Props = $props()

	import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'

	const ctx = getContext<PartyContext>('party')
	const dragContext = getContext<DragDropContext | undefined>('drag-drop')

	// Create array with proper empty slots
	let characterSlots = $derived(() => {
		const slots: (GridCharacter | undefined)[] = Array(5).fill(undefined)
		characters.forEach(char => {
			if (char.position >= 0 && char.position < 5) {
				slots[char.position] = char
			}
		})
		return slots
	})
</script>

<div class="wrapper">
	<ul
		class="characters"
		aria-label="Character Grid"
	>
		{#each characterSlots() as character, i}
			<li
				aria-label={`Character slot ${i}`}
				class:main-character={i === 0}
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
							<CharacterUnit item={character} position={i} {mainWeaponElement} {partyElement} />
						</DraggableItem>
					</DropZone>
				{:else}
					<CharacterUnit item={character} position={i} {mainWeaponElement} {partyElement} />
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;

	.characters {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: $unit-3x;

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
		border-radius: 8px;
		display: block;
	}

	.name {
		font-size: $font-small;
		text-align: center;
		color: $grey-50;
	}
</style>
