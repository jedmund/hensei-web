<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// Components
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ValidatedInput from '$lib/components/ui/ValidatedInput.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { getRarityOptions } from '$lib/utils/rarity'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Always in edit mode for new character
	const editMode = true

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Validation state for canCreate check
	let granblueIdValid = $state(false)
	let granblueIdExistsInDb = $state(false)

	// Empty character for new creation
	const emptyCharacter = {
		id: '',
		name: { en: '', jp: '' },
		granblueId: '',
		characterId: '',
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
		// Basic Info
		name: '',
		nameJp: '',
		granblueId: '',
		characterId: '', // Comma-separated for dual/trio units (e.g., "123, 456")
		rarity: 3,

		// Taxonomy
		element: 0,
		race1: null as number | null,
		race2: null as number | null,
		gender: 0,
		proficiency1: 0,
		proficiency2: 0,
		season: 0,
		series: [] as number[],
		gacha_available: false,

		// Stats
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		maxHpUlb: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		maxAtkUlb: 0,
		baseDa: 0,
		baseTa: 0,
		ougiRatio: 0,
		ougiRatioFlb: 0,

		// Uncap
		flb: false,
		ulb: false,
		special: false,

		// Dates
		releaseDate: '',
		flbDate: '',
		ulbDate: '',

		// Links
		wikiEn: '',
		wikiJa: '',
		gamewith: '',
		kamigame: '',

		// Nicknames
		nicknamesEn: [] as string[],
		nicknamesJp: [] as string[]
	})

	const rarityOptions = getRarityOptions()

	// Validation is required before create
	const canCreate = $derived(
		granblueIdValid &&
			!granblueIdExistsInDb &&
			editData.name.trim() !== '' &&
			editData.granblueId.trim() !== ''
	)

	async function validateGranblueId(value: string): Promise<{ valid: boolean; message: string }> {
		console.log('[+page] validateGranblueId called with:', value)

		if (!value || value.length !== 10) {
			console.log('[+page] Invalid length, returning early')
			granblueIdValid = false
			granblueIdExistsInDb = false
			return { valid: false, message: 'Granblue ID must be exactly 10 digits' }
		}

		try {
			console.log('[+page] Calling entityAdapter.validateCharacterGranblueId...')
			const result = await entityAdapter.validateCharacterGranblueId(value)
			console.log('[+page] API result:', result)

			if (!result.valid) {
				granblueIdValid = false
				granblueIdExistsInDb = false
				return { valid: false, message: result.error || 'Invalid Granblue ID' }
			}

			if (result.existsInDb) {
				granblueIdValid = true
				granblueIdExistsInDb = true
				return { valid: false, message: 'A character with this Granblue ID already exists' }
			}

			granblueIdValid = true
			granblueIdExistsInDb = false
			return { valid: true, message: 'Valid Granblue ID - images found on server' }
		} catch (error) {
			granblueIdValid = false
			granblueIdExistsInDb = false
			console.error('[+page] Validation error:', error)
			return { valid: false, message: 'Failed to validate Granblue ID' }
		}
	}

	async function createCharacter() {
		if (!canCreate) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				// Basic Info
				granblue_id: editData.granblueId,
				name_en: editData.name,
				name_jp: editData.nameJp,
				character_id:
					editData.characterId.trim() === ''
						? []
						: editData.characterId
								.split(',')
								.map((id) => Number(id.trim()))
								.filter((id) => !isNaN(id)),
				rarity: editData.rarity,

				// Taxonomy
				element: editData.element,
				race1: editData.race1,
				race2: editData.race2,
				gender: editData.gender,
				proficiency1: editData.proficiency1,
				proficiency2: editData.proficiency2,

				// Stats
				min_hp: editData.minHp,
				max_hp: editData.maxHp,
				max_hp_flb: editData.maxHpFlb,
				max_hp_ulb: editData.maxHpUlb,
				min_atk: editData.minAtk,
				max_atk: editData.maxAtk,
				max_atk_flb: editData.maxAtkFlb,
				max_atk_ulb: editData.maxAtkUlb,
				base_da: editData.baseDa,
				base_ta: editData.baseTa,
				ougi_ratio: editData.ougiRatio,
				ougi_ratio_flb: editData.ougiRatioFlb,

				// Uncap
				flb: editData.flb,
				ulb: editData.ulb,
				special: editData.special,

				// Dates
				release_date: editData.releaseDate || null,
				flb_date: editData.flbDate || null,
				ulb_date: editData.ulbDate || null,

				// Links
				wiki_en: editData.wikiEn,
				wiki_ja: editData.wikiJa,
				gamewith: editData.gamewith,
				kamigame: editData.kamigame,

				// Nicknames
				nicknames_en: editData.nicknamesEn,
				nicknames_jp: editData.nicknamesJp
			}

			const newCharacter = await entityAdapter.createCharacter(payload)
			// Trigger image download in background (don't await - it queues a job)
			entityAdapter.downloadCharacterImages(newCharacter.id).catch(console.error)
			await goto(`/database/characters/${newCharacter.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create character. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/characters')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Character' })} description={m.page_desc_home()} />

<div class="page">
	<SidebarHeader title="New Character">
		{#snippet leftAccessory()}
			<Button variant="secondary" size="small" onclick={handleCancel}>Cancel</Button>
		{/snippet}
		{#snippet rightAccessory()}
			<Button
				variant="primary"
				size="small"
				onclick={createCharacter}
				disabled={!canCreate || isSaving}
			>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</SidebarHeader>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title="Basic Info">
			<DetailItem label="Granblue ID">
				<ValidatedInput
					bind:value={editData.granblueId}
					placeholder="3040001000"
					onValidate={validateGranblueId}
					minLength={10}
					contained
					alignRight={false}
				/>
			</DetailItem>
			<DetailItem
				label="Name (EN)"
				bind:value={editData.name}
				editable={true}
				type="text"
				placeholder="Character name"
			/>
			<DetailItem
				label="Name (JP)"
				bind:value={editData.nameJp}
				editable={true}
				type="text"
				placeholder="キャラクター名"
			/>
			<DetailItem
				label="Rarity"
				bind:value={editData.rarity}
				editable={true}
				type="select"
				options={rarityOptions}
			/>
			<DetailItem
				label="Character ID"
				sublabel="Separate multiple IDs with commas (e.g. 123, 456)"
				bind:value={editData.characterId}
				editable={true}
				type="text"
				placeholder="Character IDs"
			/>
		</DetailsContainer>

		<CharacterUncapSection character={emptyCharacter} {editMode} bind:editData />
		<CharacterTaxonomySection character={emptyCharacter} {editMode} bind:editData />
		<CharacterStatsSection character={emptyCharacter} {editMode} bind:editData />

		<DetailsContainer title="Nicknames">
			<DetailItem label="Nicknames (EN)">
				<TagInput bind:value={editData.nicknamesEn} placeholder="Add nickname..." contained />
			</DetailItem>
			<DetailItem label="Nicknames (JP)">
				<TagInput bind:value={editData.nicknamesJp} placeholder="ニックネーム..." contained />
			</DetailItem>
		</DetailsContainer>

		<DetailsContainer title="Dates">
			<DetailItem
				label="Release Date"
				bind:value={editData.releaseDate}
				editable={true}
				type="text"
				placeholder="YYYY-MM-DD"
			/>
			{#if editData.flb}
				<DetailItem
					label="FLB Date"
					bind:value={editData.flbDate}
					editable={true}
					type="text"
					placeholder="YYYY-MM-DD"
				/>
			{/if}
			{#if editData.ulb}
				<DetailItem
					label="ULB Date"
					bind:value={editData.ulbDate}
					editable={true}
					type="text"
					placeholder="YYYY-MM-DD"
				/>
			{/if}
		</DetailsContainer>

		<DetailsContainer title="Links">
			<DetailItem
				label="Wiki (EN)"
				bind:value={editData.wikiEn}
				editable={true}
				type="text"
				placeholder="https://gbf.wiki/..."
				width="480px"
			/>
			<DetailItem
				label="Wiki (JP)"
				bind:value={editData.wikiJa}
				editable={true}
				type="text"
				placeholder="https://gbf-wiki.com/..."
				width="480px"
			/>
			<DetailItem
				label="Gamewith"
				bind:value={editData.gamewith}
				editable={true}
				type="text"
				placeholder="https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/..."
				width="480px"
			/>
			<DetailItem
				label="Kamigame"
				bind:value={editData.kamigame}
				editable={true}
				type="text"
				placeholder="https://kamigame.jp/..."
				width="480px"
			/>
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.error-banner {
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}
</style>
