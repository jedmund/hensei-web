<svelte:options runes={true} />

<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import type { PartyContext } from '$lib/services/party.service'

	interface Props {
		characters?: GridCharacter[]
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
	}

	let { characters = [], mainWeaponElement = undefined, partyElement = undefined }: Props = $props()

	import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'

	const ctx = getContext<PartyContext>('party')
</script>

<div class="wrapper">
	<ul
		class="characters"
		aria-label="Character Grid"
	>
		{#each Array(5) as _, i}
			{@const character = characters.find((c) => c.position === i)}
			<li
				aria-label={`Character slot ${i}`}
				class:main-character={i === 0}
				class:Empty={!character}
			>
				<CharacterUnit item={character} position={i} {mainWeaponElement} {partyElement} />
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
