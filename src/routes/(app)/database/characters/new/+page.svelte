<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Components
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { getCharacterImage } from '$lib/utils/images'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Always in edit mode for new character
	const editMode = true
	const canEdit = true

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	// Validation state
	let isValidating = $state(false)
	let validationError = $state<string | null>(null)
	let validationResult = $state<{
		valid: boolean
		existsInDb: boolean
		imageUrls?: { main?: string; grid?: string; square?: string }
	} | null>(null)

	// Download state
	let isDownloading = $state(false)
	let downloadStatus = $state<{
		status: string
		progress: number
		imagesDownloaded?: number
		imagesTotal?: number
		error?: string
	} | null>(null)
	let downloadPollingInterval = $state<ReturnType<typeof setInterval> | null>(null)

	// Empty character for new creation
	const emptyCharacter = {
		id: '',
		name: { en: '', jp: '' },
		granblueId: '',
		characterId: null,
		rarity: 3,
		element: 0,
		race: [],
		gender: 0,
		proficiency: [0, 0],
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		special: false
	}

	// Editable fields
	let editData = $state({
		name: '',
		granblueId: '',
		characterId: null as number | null,
		rarity: 3,
		element: 0,
		race1: null as number | null,
		race2: null as number | null,
		gender: 0,
		proficiency1: 0,
		proficiency2: 0,
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		flb: false,
		ulb: false,
		transcendence: false,
		special: false
	})

	// Validation is required before create
	const canCreate = $derived(
		validationResult?.valid === true &&
			!validationResult?.existsInDb &&
			editData.name.trim() !== '' &&
			editData.granblueId.trim() !== ''
	)

	// Get preview image from validation or placeholder
	const previewImage = $derived(
		validationResult?.imageUrls?.grid || getCharacterImage(editData.granblueId, 'grid', '01')
	)

	async function validateGranblueId() {
		if (!editData.granblueId || editData.granblueId.length !== 10) {
			validationError = 'Granblue ID must be exactly 10 digits'
			validationResult = null
			return
		}

		isValidating = true
		validationError = null
		validationResult = null

		try {
			const result = await entityAdapter.validateCharacterGranblueId(editData.granblueId)
			validationResult = {
				valid: result.valid,
				existsInDb: result.existsInDb,
				imageUrls: result.imageUrls
			}

			if (!result.valid) {
				validationError = result.error || 'Invalid Granblue ID'
			} else if (result.existsInDb) {
				validationError = 'A character with this Granblue ID already exists'
			}
		} catch (error) {
			validationError = 'Failed to validate Granblue ID'
			console.error('Validation error:', error)
		} finally {
			isValidating = false
		}
	}

	async function createCharacter() {
		if (!canCreate) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			// Prepare the data for API
			const payload = {
				granblue_id: editData.granblueId,
				name_en: editData.name,
				name_jp: '', // Can be added later
				rarity: editData.rarity,
				element: editData.element,
				race1: editData.race1,
				race2: editData.race2,
				gender: editData.gender,
				proficiency1: editData.proficiency1,
				proficiency2: editData.proficiency2,
				min_hp: editData.minHp,
				max_hp: editData.maxHp,
				max_hp_flb: editData.maxHpFlb,
				min_atk: editData.minAtk,
				max_atk: editData.maxAtk,
				max_atk_flb: editData.maxAtkFlb,
				flb: editData.flb,
				ulb: editData.ulb,
				special: editData.special
			}

			const newCharacter = await entityAdapter.createCharacter(payload)

			saveSuccess = true

			// Redirect to the new character's page
			await goto(`/database/characters/${newCharacter.id}`)
		} catch (error) {
			saveError = 'Failed to create character. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	async function startImageDownload() {
		if (!validationResult?.valid || validationResult.existsInDb) return

		// Note: This would need a character ID, so it would happen after creation
		// For now, we'll skip this and implement it in the edit page
		// The user can download images after creating the character
	}

	function handleCancel() {
		goto('/database/characters')
	}
</script>

<div>
	<DetailScaffold
		type="character"
		item={{ ...emptyCharacter, name: { en: editData.name || 'New Character', jp: '' } }}
		image={previewImage}
		showEdit={false}
		editMode={true}
		{isSaving}
		{saveSuccess}
		{saveError}
		onSave={createCharacter}
		onCancel={handleCancel}
	>
		<section class="details">
			<!-- Granblue ID Validation Section -->
			<DetailsContainer title="Granblue ID Validation">
				<div class="validation-section">
					<div class="validation-input">
						<DetailItem
							label="Granblue ID"
							bind:value={editData.granblueId}
							editable={true}
							type="text"
							placeholder="e.g., 3040001000"
						/>
						<Button
							variant="primary"
							size="small"
							onclick={validateGranblueId}
							disabled={isValidating || !editData.granblueId}
						>
							{isValidating ? 'Validating...' : 'Validate'}
						</Button>
					</div>

					{#if validationError}
						<div class="validation-error">{validationError}</div>
					{/if}

					{#if validationResult?.valid && !validationResult.existsInDb}
						<div class="validation-success">
							Valid Granblue ID - images found on server
						</div>
					{/if}

					{#if validationResult?.existsInDb}
						<div class="validation-warning">
							A character with this ID already exists in the database
						</div>
					{/if}
				</div>
			</DetailsContainer>

			<!-- Basic Info -->
			<DetailsContainer title="Basic Info">
				<DetailItem
					label="Name (EN)"
					bind:value={editData.name}
					editable={true}
					type="text"
					placeholder="Character name"
				/>
			</DetailsContainer>

			<CharacterMetadataSection character={emptyCharacter} {editMode} bind:editData />
			<CharacterUncapSection character={emptyCharacter} {editMode} bind:editData />
			<CharacterTaxonomySection character={emptyCharacter} {editMode} bind:editData />
			<CharacterStatsSection character={emptyCharacter} {editMode} bind:editData />

			<!-- Action Buttons -->
			<div class="action-buttons">
				<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
				<Button variant="primary" onclick={createCharacter} disabled={!canCreate || isSaving}>
					{isSaving ? 'Creating...' : 'Create Character'}
				</Button>
			</div>
		</section>
	</DetailScaffold>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details {
		display: flex;
		flex-direction: column;
	}

	.validation-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
	}

	.validation-input {
		display: flex;
		align-items: flex-end;
		gap: spacing.$unit-2x;

		:global(.detail-item) {
			flex: 1;
		}
	}

	.validation-error {
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit;
		background: colors.$error--bg--light;
		border-radius: 4px;
	}

	.validation-success {
		color: colors.$wind-text-20;
		font-size: typography.$font-small;
		padding: spacing.$unit;
		background: colors.$wind-bg-20;
		border-radius: 4px;
	}

	.validation-warning {
		color: colors.$orange-40;
		font-size: typography.$font-small;
		padding: spacing.$unit;
		background: colors.$orange-90;
		border-radius: 4px;
	}

	.action-buttons {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		border-top: 1px solid colors.$grey-80;
	}
</style>
