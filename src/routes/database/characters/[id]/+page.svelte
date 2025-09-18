<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Utility functions
	import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'
	import { getProficiencyLabel, getProficiencyOptions } from '$lib/utils/proficiency'
	import { getRaceLabel, getRaceOptions } from '$lib/utils/race'
	import { getGenderLabel, getGenderOptions } from '$lib/utils/gender'
	import { getCharacterMaxUncapLevel } from '$lib/utils/uncap'

	// Components
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get character from server data
	const character = $derived(data.character)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit mode state
	let editMode = $state(false)
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	// Editable fields - create reactive state for each field
	let editData = $state({
		name: character?.name || '',
		granblue_id: character?.granblue_id || '',
		rarity: character?.rarity || 1,
		element: character?.element || 0,
		race1: character?.race?.[0] ?? null,
		race2: character?.race?.[1] ?? null,
		gender: character?.gender || 0,
		proficiency1: character?.proficiency?.[0] || 0,
		proficiency2: character?.proficiency?.[1] || 0,
		min_hp: character?.hp?.min_hp || 0,
		max_hp: character?.hp?.max_hp || 0,
		max_hp_flb: character?.hp?.max_hp_flb || 0,
		min_atk: character?.atk?.min_atk || 0,
		max_atk: character?.atk?.max_atk || 0,
		max_atk_flb: character?.atk?.max_atk_flb || 0,
		flb: character?.uncap?.flb || false,
		ulb: character?.uncap?.ulb || false,
		transcendence: character?.uncap?.transcendence || false,
		special: character?.special || false
	})

	// Reset edit data when character changes
	$effect(() => {
		if (character) {
			editData = {
				name: character.name || '',
				granblue_id: character.granblue_id || '',
				rarity: character.rarity || 1,
				element: character.element || 0,
				race1: character.race?.[0] ?? null,
				race2: character.race?.[1] ?? null,
				gender: character.gender || 0,
				proficiency1: character.proficiency?.[0] || 0,
				proficiency2: character.proficiency?.[1] || 0,
				min_hp: character.hp?.min_hp || 0,
				max_hp: character.hp?.max_hp || 0,
				max_hp_flb: character.hp?.max_hp_flb || 0,
				min_atk: character.atk?.min_atk || 0,
				max_atk: character.atk?.max_atk || 0,
				max_atk_flb: character.atk?.max_atk_flb || 0,
				flb: character.uncap?.flb || false,
				ulb: character.uncap?.ulb || false,
				transcendence: character.uncap?.transcendence || false,
				special: character.special || false
			}
		}
	})

	// Options for select dropdowns - using centralized utilities
	const rarityOptions = getRarityOptions()
	const elementOptions = getElementOptions()
	const raceOptions = getRaceOptions()
	const genderOptions = getGenderOptions()
	const proficiencyOptions = getProficiencyOptions()

	function toggleEditMode() {
		editMode = !editMode
		saveError = null
		saveSuccess = false

		// Reset data when canceling
		if (!editMode && character) {
			editData = {
				name: character.name || '',
				granblue_id: character.granblue_id || '',
				rarity: character.rarity || 1,
				element: character.element || 0,
				race1: character.race?.[0] ?? null,
				race2: character.race?.[1] ?? null,
				gender: character.gender || 0,
				proficiency1: character.proficiency?.[0] || 0,
				proficiency2: character.proficiency?.[1] || 0,
				min_hp: character.hp?.min_hp || 0,
				max_hp: character.hp?.max_hp || 0,
				max_hp_flb: character.hp?.max_hp_flb || 0,
				min_atk: character.atk?.min_atk || 0,
				max_atk: character.atk?.max_atk || 0,
				max_atk_flb: character.atk?.max_atk_flb || 0,
				flb: character.uncap?.flb || false,
				ulb: character.uncap?.ulb || false,
				transcendence: character.uncap?.transcendence || false,
				special: character.special || false
			}
		}
	}

	async function saveChanges() {
		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			// Prepare the data for API
			const payload = {
				name: editData.name,
				granblue_id: editData.granblue_id,
				rarity: editData.rarity,
				element: editData.element,
				race: [editData.race1, editData.race2].filter(r => r !== null && r !== undefined),
				gender: editData.gender,
				proficiency: [editData.proficiency1, editData.proficiency2],
				hp: {
					min_hp: editData.min_hp,
					max_hp: editData.max_hp,
					max_hp_flb: editData.max_hp_flb
				},
				atk: {
					min_atk: editData.min_atk,
					max_atk: editData.max_atk,
					max_atk_flb: editData.max_atk_flb
				},
				uncap: {
					flb: editData.flb,
					ulb: editData.ulb,
					transcendence: editData.transcendence
				},
				special: editData.special
			}

			// TODO: When backend endpoint is ready, make the API call here
			// const response = await fetch(`/api/v1/characters/${character.id}`, {
			//   method: 'PUT',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(payload)
			// })

			// For now, just simulate success
			await new Promise((resolve) => setTimeout(resolve, 1000))

			saveSuccess = true
			editMode = false

			// Show success message for 3 seconds
			setTimeout(() => {
				saveSuccess = false
			}, 3000)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	// Helper function to get character image
	function getCharacterImage(character: any): string {
		if (!character?.granblue_id) return '/images/placeholders/placeholder-character-main.png'
		return `/images/character-grid/${character.granblue_id}_01.jpg`
	}

	// Calculate uncap properties for the indicator
	const uncap = $derived(
		editMode
			? { flb: editData.flb, ulb: editData.ulb, transcendence: editData.transcendence }
			: (character?.uncap ?? {})
	)
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const special = $derived(editMode ? editData.special : (character?.special ?? false))

	const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
	const transcendenceStage = $derived(transcendence ? 5 : 0)
</script>

<div>
	{#if character}
		<div class="content">
			<DetailsHeader
				type="character"
				item={character}
				image={getCharacterImage(character)}
				onEdit={toggleEditMode}
				showEdit={canEdit}
				{editMode}
				onSave={saveChanges}
				onCancel={toggleEditMode}
				{isSaving}
			/>

			{#if saveSuccess || saveError}
				<div class="edit-controls">
					{#if saveSuccess}
						<span class="success-message">Changes saved successfully!</span>
					{/if}

					{#if saveError}
						<span class="error-message">{saveError}</span>
					{/if}
				</div>
			{/if}

			<DetailsContainer title="Metadata">
				{#if editMode}
					<DetailItem
						label="Rarity"
						bind:value={editData.rarity}
						editable={true}
						type="select"
						options={rarityOptions}
					/>
					<DetailItem
						label="Granblue ID"
						bind:value={editData.granblue_id}
						editable={true}
						type="text"
					/>
				{:else}
					<DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
					<DetailItem label="Granblue ID" value={character.granblue_id} />
				{/if}
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

				{#if editMode}
					<DetailItem label="FLB" bind:value={editData.flb} editable={true} type="checkbox" />
					<DetailItem label="ULB" bind:value={editData.ulb} editable={true} type="checkbox" />
					<DetailItem
						label="Transcendence"
						bind:value={editData.transcendence}
						editable={true}
						type="checkbox"
					/>
					<DetailItem
						label="Special"
						bind:value={editData.special}
						editable={true}
						type="checkbox"
					/>
				{/if}

				{#if editMode}
					<DetailItem
						label="Element"
						bind:value={editData.element}
						editable={true}
						type="select"
						options={elementOptions}
					/>
					<DetailItem
						label="Race 1"
						bind:value={editData.race1}
						editable={true}
						type="select"
						options={raceOptions}
					/>
					<DetailItem
						label="Race 2"
						bind:value={editData.race2}
						editable={true}
						type="select"
						options={raceOptions}
					/>
					<DetailItem
						label="Gender"
						bind:value={editData.gender}
						editable={true}
						type="select"
						options={genderOptions}
					/>
					<DetailItem
						label="Proficiency 1"
						bind:value={editData.proficiency1}
						editable={true}
						type="select"
						options={proficiencyOptions}
					/>
					<DetailItem
						label="Proficiency 2"
						bind:value={editData.proficiency2}
						editable={true}
						type="select"
						options={proficiencyOptions}
					/>
				{:else}
					<DetailItem label="Element" value={getElementLabel(character.element)} />
					<DetailItem label="Race 1" value={getRaceLabel(character.race?.[0])} />
					{#if character.race?.[1]}
						<DetailItem label="Race 2" value={getRaceLabel(character.race?.[1])} />
					{/if}
					<DetailItem label="Gender" value={getGenderLabel(character.gender)} />
					<DetailItem label="Proficiency 1" value={getProficiencyLabel(character.proficiency[0])} />
					<DetailItem label="Proficiency 2" value={getProficiencyLabel(character.proficiency[1])} />
				{/if}
			</DetailsContainer>

			<DetailsContainer title="HP Stats">
				{#if editMode}
					<DetailItem
						label="Base HP"
						bind:value={editData.min_hp}
						editable={true}
						type="number"
						placeholder="0"
					/>
					<DetailItem
						label="Max HP"
						bind:value={editData.max_hp}
						editable={true}
						type="number"
						placeholder="0"
					/>
					<DetailItem
						label="Max HP (FLB)"
						bind:value={editData.max_hp_flb}
						editable={true}
						type="number"
						placeholder="0"
					/>
				{:else}
					<DetailItem label="Base HP" value={character.hp?.min_hp} />
					<DetailItem label="Max HP" value={character.hp?.max_hp} />
					{#if flb}
						<DetailItem label="Max HP (FLB)" value={character.hp?.max_hp_flb} />
					{/if}
				{/if}
			</DetailsContainer>

			<DetailsContainer title="Attack Stats">
				{#if editMode}
					<DetailItem
						label="Base Attack"
						bind:value={editData.min_atk}
						editable={true}
						type="number"
						placeholder="0"
					/>
					<DetailItem
						label="Max Attack"
						bind:value={editData.max_atk}
						editable={true}
						type="number"
						placeholder="0"
					/>
					<DetailItem
						label="Max Attack (FLB)"
						bind:value={editData.max_atk_flb}
						editable={true}
						type="number"
						placeholder="0"
					/>
				{:else}
					<DetailItem label="Base Attack" value={character.atk?.min_atk} />
					<DetailItem label="Max Attack" value={character.atk?.max_atk} />
					{#if flb}
						<DetailItem label="Max Attack (FLB)" value={character.atk?.max_atk_flb} />
					{/if}
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
	@use '$src/themes/effects' as effects;

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
		overflow: visible; // Changed from hidden to allow sticky header
		margin-top: spacing.$unit-2x;
		position: relative;
	}

	.edit-controls {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid colors.$grey-80;
		display: flex;
		gap: spacing.$unit;
		align-items: center;

		.success-message {
			color: colors.$grey-30;
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}

		.error-message {
			color: colors.$error;
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
