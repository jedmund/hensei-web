<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// Components
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import WeaponForgeSection from '$lib/features/database/weapons/sections/WeaponForgeSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ValidatedInput from '$lib/components/ui/ValidatedInput.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { getRarityOptions } from '$lib/utils/rarity'

	// Always in edit mode for new weapon
	const editMode = true

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Validation state for canCreate check
	let granblueIdValid = $state(false)
	let granblueIdExistsInDb = $state(false)

	// Empty weapon for new creation
	const emptyWeapon = {
		id: '',
		name: { en: '', jp: '' },
		granblueId: '',
		rarity: 3,
		element: 0,
		proficiency: 0,
		series: 0,
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0, maxHpUlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0, maxAtkUlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		maxLevel: 100
	}

	// Editable fields
	let editData = $state({
		// Basic Info
		name: '',
		nameJp: '',
		granblueId: '',
		rarity: 3,

		// Taxonomy
		element: 0,
		proficiency: 0,
		series: 0,
		newSeries: 0,
		promotions: [] as number[],

		// Stats
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		maxHpUlb: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		maxAtkUlb: 0,
		maxLevel: 100,
		maxSkillLevel: 10,
		maxAwakeningLevel: 0,
		maxExorcismLevel: null as number | null,

		// Uncap
		flb: false,
		ulb: false,
		transcendence: false,
		extraPrerequisite: '' as number | '',
		extra: false,
		limit: false,
		ax: false,

		// Dates
		releaseDate: '',
		flbDate: '',
		ulbDate: '',
		transcendenceDate: '',

		// Links
		wikiEn: '',
		wikiJa: '',
		gamewith: '',
		kamigame: '',

		// Nicknames
		nicknamesEn: [] as string[],
		nicknamesJp: [] as string[],

		// Recruits (Character ID)
		recruits: null as string | null,

		// Forge chain
		forgedFrom: null as string | null,
		forgeOrder: null as number | null
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
		if (!value || value.length !== 10) {
			granblueIdValid = false
			granblueIdExistsInDb = false
			return { valid: false, message: 'Granblue ID must be exactly 10 digits' }
		}

		try {
			const result = await entityAdapter.validateWeaponGranblueId(value)

			if (!result.valid) {
				granblueIdValid = false
				granblueIdExistsInDb = false
				return { valid: false, message: result.error || 'Invalid Granblue ID' }
			}

			if (result.existsInDb) {
				granblueIdValid = true
				granblueIdExistsInDb = true
				return { valid: false, message: 'A weapon with this Granblue ID already exists' }
			}

			granblueIdValid = true
			granblueIdExistsInDb = false
			return { valid: true, message: 'Valid Granblue ID - images found on server' }
		} catch (error) {
			granblueIdValid = false
			granblueIdExistsInDb = false
			console.error('Validation error:', error)
			return { valid: false, message: 'Failed to validate Granblue ID' }
		}
	}

	async function createWeapon() {
		if (!canCreate) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				// Basic Info
				granblue_id: editData.granblueId,
				name_en: editData.name,
				name_jp: editData.nameJp || undefined,
				rarity: editData.rarity,

				// Taxonomy
				element: editData.element,
				proficiency: editData.proficiency,
				series: editData.series || undefined,
				new_series: editData.newSeries || undefined,

				// Stats
				min_hp: editData.minHp,
				max_hp: editData.maxHp,
				max_hp_flb: editData.maxHpFlb,
				max_hp_ulb: editData.maxHpUlb,
				min_atk: editData.minAtk,
				max_atk: editData.maxAtk,
				max_atk_flb: editData.maxAtkFlb,
				max_atk_ulb: editData.maxAtkUlb,
				max_level: editData.maxLevel,
				max_skill_level: editData.maxSkillLevel,
				max_awakening_level: editData.maxAwakeningLevel,
				max_exorcism_level: editData.maxExorcismLevel,

				// Uncap
				flb: editData.flb,
				ulb: editData.ulb,
				transcendence: editData.transcendence,
				extra_prerequisite: editData.extraPrerequisite === '' ? null : editData.extraPrerequisite,
				extra: editData.extra,
				limit: editData.limit,
				ax: editData.ax,

				// Dates
				release_date: editData.releaseDate || null,
				flb_date: editData.flbDate || null,
				ulb_date: editData.ulbDate || null,
				transcendence_date: editData.transcendenceDate || null,

				// Links
				wiki_en: editData.wikiEn,
				wiki_ja: editData.wikiJa,
				gamewith: editData.gamewith,
				kamigame: editData.kamigame,

				// Nicknames
				nicknames_en: editData.nicknamesEn,
				nicknames_jp: editData.nicknamesJp,

				// Recruits
				recruits: editData.recruits,

				// Forge chain
				forged_from: editData.forgedFrom || null,
				forge_order: editData.forgeOrder
			}

			const newWeapon = await entityAdapter.createWeapon(payload)
			// Trigger image download in background (don't await - it queues a job)
			entityAdapter.downloadWeaponImages(newWeapon.id).catch(console.error)
			await goto(`/database/weapons/${newWeapon.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create weapon. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/weapons')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Weapon' })} description={m.page_desc_home()} />

<div class="page">
	<SidebarHeader title="New Weapon">
		{#snippet leftAccessory()}
			<Button variant="secondary" size="small" onclick={handleCancel}>Cancel</Button>
		{/snippet}
		{#snippet rightAccessory()}
			<Button
				variant="primary"
				size="small"
				onclick={createWeapon}
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
					placeholder="1040001000"
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
				placeholder="Weapon name"
			/>
			<DetailItem
				label="Name (JP)"
				bind:value={editData.nameJp}
				editable={true}
				type="text"
				placeholder="武器名"
			/>
			<DetailItem
				label="Rarity"
				bind:value={editData.rarity}
				editable={true}
				type="select"
				options={rarityOptions}
			/>
		</DetailsContainer>

		<WeaponUncapSection weapon={emptyWeapon} {editMode} bind:editData />
		<WeaponTaxonomySection weapon={emptyWeapon} {editMode} bind:editData />
		<WeaponStatsSection weapon={emptyWeapon} {editMode} bind:editData />
		<WeaponForgeSection weapon={emptyWeapon} {editMode} bind:editData />

		<DetailsContainer title="Nicknames">
			<DetailItem label="Nicknames (EN)">
				<TagInput bind:value={editData.nicknamesEn} placeholder="Add nickname..." contained />
			</DetailItem>
			<DetailItem label="Nicknames (JP)">
				<TagInput bind:value={editData.nicknamesJp} placeholder="ニックネームを入力" contained />
			</DetailItem>
		</DetailsContainer>

		<DetailsContainer title="Recruits">
			<DetailItem label="Recruits Character" sublabel="Character recruited by this weapon" editable={true}>
				<CharacterTypeahead bind:value={editData.recruits} placeholder="Search for character..." contained />
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
			{#if editData.transcendence}
				<DetailItem
					label="Transcendence Date"
					bind:value={editData.transcendenceDate}
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
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: colors.$error--bg--light;
	}
</style>
