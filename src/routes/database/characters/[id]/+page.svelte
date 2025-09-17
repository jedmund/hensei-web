<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Utility functions
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel } from '$lib/utils/element'
	import { getProficiencyLabel } from '$lib/utils/proficiency'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import { getCharacterMaxUncapLevel } from '$lib/utils/uncap'

	// Components
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get character from server data
	const character = $derived(data.character)

	// Helper function to get character image
	function getCharacterImage(character: any): string {
		if (!character?.granblue_id) return '/images/placeholders/placeholder-character-main.png'
		return `/images/character-grid/${character.granblue_id}_01.jpg`
	}

	// Calculate uncap properties for the indicator
	const uncap = $derived(character?.uncap ?? {})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const special = $derived(character?.special ?? false)

	const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
	const transcendenceStage = $derived(transcendence ? 5 : 0)
</script>

<div>
	{#if character}
		<div class="content">
			<DetailsHeader type="character" item={character} image={getCharacterImage(character)} />

			<DetailsContainer title="Metadata">
				<DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
				<DetailItem label="Granblue ID" value={character.granblue_id} />
			</DetailsContainer>
			<DetailsContainer title="Details">
				{#if character.uncap}
					<DetailItem label="Uncap">
						<UncapIndicator
							type="character"
							{uncapLevel}
							{transcendenceStage}
							{flb}
							{ulb}
							{transcendence}
							{special}
							editable={false}
						/>
					</DetailItem>
				{/if}
				<DetailItem label="Element" value={getElementLabel(character.element)} />
				<DetailItem label="Race" value={getRaceLabel(character.race)} />
				<DetailItem label="Gender" value={getGenderLabel(character.gender)} />

				<DetailItem label="Proficiency 1" value={getProficiencyLabel(character.proficiency[0])} />
				<DetailItem label="Proficiency 2" value={getProficiencyLabel(character.proficiency[1])} />
			</DetailsContainer>

			<DetailsContainer title="HP Stats">
				<DetailItem label="Base HP" value={character.hp?.min_hp} />
				<DetailItem label="Max HP" value={character.hp?.max_hp} />
				{#if flb}
					<DetailItem label="Max HP (FLB)" value={character.hp?.max_hp_flb} />
				{/if}
			</DetailsContainer>

			<DetailsContainer title="Attack Stats">
				<DetailItem label="Base Attack" value={character.atk?.min_atk} />
				<DetailItem label="Max Attack" value={character.atk?.max_atk} />
				{#if flb}
					<DetailItem label="Max Attack (FLB)" value={character.atk?.max_atk_flb} />
				{/if}
			</DetailsContainer>
		</div>
	{:else}
		<div class="not-found">
			<h2>Character Not Found</h2>
			<p>The character you're looking for could not be found.</p>
			<button onclick={() => goto('/database/characters')}>Back to Characters</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: #007bff;
			color: white;
			border: none;
			padding: spacing.$unit * 0.5 spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}

	.content {
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		margin-top: spacing.$unit-2x;
	}
</style>
