<script lang="ts">
	import SelectableCharacterCard from './SelectableCharacterCard.svelte'
	import SelectableCharacterRow from './SelectableCharacterRow.svelte'
	import SelectableWeaponCard from './SelectableWeaponCard.svelte'
	import SelectableWeaponRow from './SelectableWeaponRow.svelte'
	import SelectableSummonCard from './SelectableSummonCard.svelte'
	import SelectableSummonRow from './SelectableSummonRow.svelte'
	import type { AddToCollectionEntityType, AddToCollectionResult } from './add-to-collection.utils'

	interface Props {
		entityType: AddToCollectionEntityType
		results: AddToCollectionResult[]
		view: 'grid' | 'list'
		selectedIds: Set<string>
		quantities: Map<string, number>
		onToggle: (character: AddToCollectionResult) => void
		onQuantityChange: (item: AddToCollectionResult, quantity: number) => void
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let {
		entityType,
		results,
		view,
		selectedIds,
		quantities,
		onToggle,
		onQuantityChange,
		userElement
	}: Props = $props()
</script>

{#if view === 'grid'}
	<div class="results-grid">
		{#if entityType === 'character'}
			{#each results as character (character.id)}
				<SelectableCharacterCard
					{character}
					selected={selectedIds.has(character.id)}
					{onToggle}
					{userElement}
				/>
			{/each}
		{:else if entityType === 'weapon'}
			{#each results as weapon (weapon.id)}
				<SelectableWeaponCard
					{weapon}
					quantity={quantities.get(weapon.id) ?? 0}
					{onQuantityChange}
					{userElement}
				/>
			{/each}
		{:else}
			{#each results as summon (summon.id)}
				<SelectableSummonCard
					{summon}
					quantity={quantities.get(summon.id) ?? 0}
					{onQuantityChange}
					{userElement}
				/>
			{/each}
		{/if}
	</div>
{:else}
	<div class="results-list">
		{#if entityType === 'character'}
			{#each results as character (character.id)}
				<SelectableCharacterRow
					{character}
					selected={selectedIds.has(character.id)}
					{onToggle}
					{userElement}
				/>
			{/each}
		{:else if entityType === 'weapon'}
			{#each results as weapon (weapon.id)}
				<SelectableWeaponRow
					{weapon}
					quantity={quantities.get(weapon.id) ?? 0}
					{onQuantityChange}
					{userElement}
				/>
			{/each}
		{:else}
			{#each results as summon (summon.id)}
				<SelectableSummonRow
					{summon}
					quantity={quantities.get(summon.id) ?? 0}
					{onQuantityChange}
					{userElement}
				/>
			{/each}
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: $unit;
		padding: $unit 0;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit 0;
	}
</style>
