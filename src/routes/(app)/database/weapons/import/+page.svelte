<svelte:options runes={true} />

<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { entityAdapter, type ParsedWeaponData } from '$lib/api/adapters/entity.adapter'
	import { fetchWikiPages, buildWikiDataMap } from '$lib/api/wiki'
	import { getGameCdnWeaponImage, getPlaceholderImage } from '$lib/utils/images'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import { getRarityPrefix } from '$lib/utils/rarity'

	// Components
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import WeaponMetadataSection from '$lib/features/database/weapons/sections/WeaponMetadataSection.svelte'
	import WeaponGachaSection from '$lib/features/database/weapons/sections/WeaponGachaSection.svelte'
	import WeaponForgeSection from '$lib/features/database/weapons/sections/WeaponForgeSection.svelte'
	import TabbedEntitySelector from '$lib/features/database/import/TabbedEntitySelector.svelte'
	import type { EntityTab } from '$lib/features/database/import/TabbedEntitySelector.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'

	import type { PageData } from './$types'

	// Internal entity state including loading status
	interface EntityState {
		wikiPage: string
		status: 'loading' | 'success' | 'error'
		granblueId?: string
		parsedData?: ParsedWeaponData
		error?: string
	}

	let { data }: { data: PageData } = $props()

	// Input phase
	let wikiPagesInputs = $state<string[]>(['', '', ''])
	let isFetching = $state(false)
	let fetchError = $state<string | null>(null)

	// Fetched entities
	let entities = $state<Map<string, EntityState>>(new Map())
	let selectedWikiPage = $state<string | null>(null)

	// Form data per entity (keyed by wikiPage) - using Record for proper reactivity
	let formDataByPage = $state<Record<string, any>>({})
	let savedEntities = $state<Set<string>>(new Set())

	// Store wiki raw data per entity for sending with create request
	let wikiRawByPage = $state<Record<string, string>>({})

	// Saving state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Empty weapon for form sections
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

	// Get selected entity data
	const selectedEntity = $derived(selectedWikiPage ? entities.get(selectedWikiPage) : null)

	// Auto-generate wiki URLs when Name (JP) or Rarity changes
	$effect(() => {
		if (!selectedWikiPage) return
		const formData = formDataByPage[selectedWikiPage]
		if (!formData) return

		const nameJp = formData.nameJp
		const rarity = formData.rarity

		if (nameJp) {
			// Auto-generate wikiJa: "Name (JP) (SSR)"
			formData.wikiJa = `${nameJp} (${getRarityPrefix(rarity)})`
			// Auto-generate kamigame: "SSRName (JP)" for weapons
			formData.kamigame = `${getRarityPrefix(rarity)}${nameJp}`
		}
	})

	// Entity tabs for TabbedEntitySelector
	const entityTabs = $derived<EntityTab[]>(
		Array.from(entities.entries()).map(([wikiPage, entity]) => ({
			wikiPage,
			granblueId: entity.granblueId,
			status: entity.status,
			imageUrl: entity.granblueId
				? getGameCdnWeaponImage(entity.granblueId)
				: getPlaceholderImage('weapon', 'square'),
			error: entity.error,
			saved: savedEntities.has(wikiPage)
		}))
	)

	// Initialize empty form data for an entity
	function createEmptyFormData(wikiPage: string, parsedData?: ParsedWeaponData) {
		return {
			name: parsedData?.nameEn ?? '',
			nameJp: parsedData?.nameJp ?? '',
			granblue_id: parsedData?.granblueId ?? '',
			rarity: parsedData?.rarity ?? 3,
			element: parsedData?.element ?? 0,
			proficiency: parsedData?.proficiency ?? 0,
			series: parsedData?.series ?? '',
			newSeries: 0,
			promotions: [] as number[],
			minHp: parsedData?.minHp ?? 0,
			maxHp: parsedData?.maxHp ?? 0,
			maxHpFlb: parsedData?.maxHpFlb ?? 0,
			maxHpUlb: parsedData?.maxHpUlb ?? 0,
			minAtk: parsedData?.minAtk ?? 0,
			maxAtk: parsedData?.maxAtk ?? 0,
			maxAtkFlb: parsedData?.maxAtkFlb ?? 0,
			maxAtkUlb: parsedData?.maxAtkUlb ?? 0,
			maxLevel: parsedData?.maxLevel ?? 100,
			maxSkillLevel: 10,
			maxAwakeningLevel: 0,
			maxExorcismLevel: null as number | null,
			flb: parsedData?.flb ?? false,
			ulb: parsedData?.ulb ?? false,
			transcendence: parsedData?.transcendence ?? false,
			extraPrerequisite: '' as number | '',
			extra: false,
			limit: false,
			ax: false,
			releaseDate: parsedData?.releaseDate ?? '',
			flbDate: parsedData?.flbDate ?? '',
			ulbDate: parsedData?.ulbDate ?? '',
			transcendenceDate: '',
			wikiEn: wikiPage ? wikiPage.replace(/ /g, '_') : '',
			wikiJa: '',
			gamewith: parsedData?.gamewith ?? '',
			kamigame: parsedData?.kamigame ?? '',
			nicknamesEn: [] as string[],
			nicknamesJp: [] as string[],
			recruits: parsedData?.recruits ?? null,
			// Forge chain
			forgedFrom: null as string | null,
			forgeOrder: null as number | null
		}
	}

	// Add/remove input fields
	function addInput() {
		if (wikiPagesInputs.length >= 10) return
		wikiPagesInputs = [...wikiPagesInputs, '']
	}

	function removeInput(index: number) {
		if (wikiPagesInputs.length > 1) {
			wikiPagesInputs = wikiPagesInputs.filter((_, i) => i !== index)
		}
	}

	// Fetch wiki data for entered pages
	async function fetchWikiData() {
		const pages = wikiPagesInputs
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
			.slice(0, 10)

		if (pages.length === 0) {
			fetchError = 'Please enter at least one wiki page name'
			return
		}

		isFetching = true
		fetchError = null

		// Initialize entities as loading
		const newEntities = new Map<string, EntityState>()
		pages.forEach((page) => {
			newEntities.set(page, {
				wikiPage: page,
				status: 'loading'
			})
		})
		entities = newEntities
		selectedWikiPage = pages[0] ?? null

		try {
			// Step 1: Fetch wiki data client-side (bypasses CloudFlare)
			const wikiResults = await fetchWikiPages(pages)
			const wikiData = buildWikiDataMap(wikiResults)

			// Store wiki raw data for sending with create request
			wikiRawByPage = { ...wikiData }

			// Update pages array with any redirects
			const finalPages = wikiResults.map((r) => r.wikiPage)

			// Step 2: Send to API for parsing (with pre-fetched wiki data)
			const response = await entityAdapter.batchPreviewWeapons(finalPages, wikiData)

			// Update entities with results
			const updatedEntities = new Map<string, EntityState>()
			response.results.forEach((result) => {
				updatedEntities.set(result.wikiPage, {
					wikiPage: result.wikiPage,
					status: result.status,
					granblueId: result.granblueId,
					parsedData: result.parsedData,
					error: result.error
				})

				// Create form data for successful results
				if (result.status === 'success') {
					formDataByPage[result.wikiPage] = createEmptyFormData(result.wikiPage, result.parsedData)
				}
			})
			entities = updatedEntities

			// Trigger reactivity by reassigning
			formDataByPage = { ...formDataByPage }
		} catch (error) {
			console.error('Batch preview error:', error)
			fetchError = 'Failed to fetch wiki data. Please try again.'
		} finally {
			isFetching = false
		}
	}

	// Handle entity selection
	function handleSelectEntity(wikiPage: string) {
		selectedWikiPage = wikiPage
	}

	// Save current entity
	async function saveCurrentEntity() {
		if (!selectedWikiPage) return
		const formData = formDataByPage[selectedWikiPage]
		if (!formData) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				granblue_id: formData.granblue_id,
				name_en: formData.name,
				name_jp: formData.nameJp || undefined,
				rarity: formData.rarity,
				element: formData.element,
				proficiency: formData.proficiency,
				series: formData.series || undefined,
				new_series: formData.newSeries || undefined,
				promotions: formData.promotions,
				min_hp: formData.minHp,
				max_hp: formData.maxHp,
				max_hp_flb: formData.maxHpFlb,
				max_hp_ulb: formData.maxHpUlb,
				min_atk: formData.minAtk,
				max_atk: formData.maxAtk,
				max_atk_flb: formData.maxAtkFlb,
				max_atk_ulb: formData.maxAtkUlb,
				max_level: formData.maxLevel,
				max_skill_level: formData.maxSkillLevel,
				max_awakening_level: formData.maxAwakeningLevel,
				max_exorcism_level: formData.maxExorcismLevel,
				flb: formData.flb,
				ulb: formData.ulb,
				transcendence: formData.transcendence,
				extra_prerequisite: formData.extraPrerequisite === '' ? null : formData.extraPrerequisite,
				extra: formData.extra,
				limit: formData.limit,
				ax: formData.ax,
				release_date: formData.releaseDate || null,
				flb_date: formData.flbDate || null,
				ulb_date: formData.ulbDate || null,
				transcendence_date: formData.transcendenceDate || null,
				wiki_en: formData.wikiEn,
				wiki_ja: formData.wikiJa,
				gamewith: formData.gamewith,
				kamigame: formData.kamigame,
				nicknames_en: formData.nicknamesEn,
				nicknames_jp: formData.nicknamesJp,
				recruits: formData.recruits,
				wiki_raw: wikiRawByPage[selectedWikiPage] || undefined,
				// Forge chain
				forged_from: formData.forgedFrom || null,
				forge_order: formData.forgeOrder
			}

			const newWeapon = await entityAdapter.createWeapon(payload)
			// Trigger image download in background (don't await - it queues a job)
			entityAdapter.downloadWeaponImages(newWeapon.id).catch(console.error)
			savedEntities.add(selectedWikiPage)
			savedEntities = new Set(savedEntities)

			// Select next unsaved entity
			const unsaved = entityTabs.find(
				(e) => !savedEntities.has(e.wikiPage) && e.status === 'success'
			)
			if (unsaved) {
				selectedWikiPage = unsaved.wikiPage
			}
		} catch (error) {
			saveError = 'Failed to save weapon. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/weapons')
	}

	// Can save current entity
	const canSave = $derived.by(() => {
		if (!selectedWikiPage) return false
		const formData = formDataByPage[selectedWikiPage]
		if (!formData) return false
		return (
			formData.name.trim() !== '' &&
			formData.granblue_id.trim() !== '' &&
			!savedEntities.has(selectedWikiPage)
		)
	})

	// All entities saved
	const allSaved = $derived(
		entityTabs.length > 0 &&
			entityTabs.filter((e) => e.status === 'success').every((e) => savedEntities.has(e.wikiPage))
	)
</script>

<PageMeta title={m.page_title_db_import({ type: 'Weapons' })} description={m.page_desc_home()} />

<div class="page">
	<SidebarHeader title="Batch Import Weapons">
		{#snippet leftAccessory()}
			<Button variant="secondary" size="small" onclick={handleCancel}>
				{allSaved ? 'Done' : 'Cancel'}
			</Button>
		{/snippet}
		{#snippet rightAccessory()}
			{#if selectedEntity?.status === 'success'}
				<Button
					variant="primary"
					size="small"
					onclick={saveCurrentEntity}
					disabled={!canSave || isSaving}
				>
					{isSaving ? 'Saving...' : 'Save Weapon'}
				</Button>
			{/if}
		{/snippet}
	</SidebarHeader>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<!-- Input phase -->
	{#if entities.size === 0}
		<form class="input-phase" onsubmit={(e) => { e.preventDefault(); fetchWikiData(); }}>
			<div class="input-header">
				<p class="hint">Enter up to 10 wiki page names to import data</p>
				<Button
					variant="ghost"
					class="add-input-button"
					leftIcon="plus"
					size="small"
					type="button"
					onclick={addInput}
				>
					Add another
				</Button>
			</div>
			<div class="wiki-inputs">
				{#each wikiPagesInputs as _, index}
					<div class="input-row">
						<Input bind:value={wikiPagesInputs[index]} placeholder="Ixaba" contained fullWidth />
						{#if wikiPagesInputs.length > 1}
							<button
								type="button"
								class="remove-button"
								onclick={() => removeInput(index)}
								aria-label="Remove input"
							>
								<Icon name="close" size={16} />
							</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if fetchError}
				<p class="error">{fetchError}</p>
			{/if}
			<div class="fetch-button">
				<Button variant="primary" type="submit" disabled={isFetching}>
					{isFetching ? 'Fetching...' : 'Fetch data'}
				</Button>
			</div>
		</form>
	{:else}
		<!-- Entity selector -->
		<div class="entity-selector-container">
			<TabbedEntitySelector
				entities={entityTabs}
				{selectedWikiPage}
				onSelect={handleSelectEntity}
				entityType="weapon"
			/>
		</div>

		<!-- Form for selected entity -->
		{#if selectedEntity}
			{#if selectedEntity.status === 'error'}
				<div class="entity-error">
					<h3>Failed to load: {selectedWikiPage}</h3>
					<p>{selectedEntity.error}</p>
				</div>
			{:else if selectedEntity.status === 'loading'}
				<div class="entity-loading">
					<p>Loading wiki data...</p>
				</div>
			{:else if selectedWikiPage && formDataByPage[selectedWikiPage]}
				<section class="details">
					<WeaponMetadataSection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<WeaponUncapSection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<WeaponTaxonomySection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<WeaponStatsSection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<WeaponGachaSection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<WeaponForgeSection
						weapon={emptyWeapon}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<DetailsContainer title="Nicknames">
						<DetailItem label="Nicknames (EN)">
							<TagInput bind:value={formDataByPage[selectedWikiPage].nicknamesEn} placeholder="Add nickname..." contained />
						</DetailItem>
						<DetailItem label="Nicknames (JP)">
							<TagInput bind:value={formDataByPage[selectedWikiPage].nicknamesJp} placeholder="ニックネーム..." contained />
						</DetailItem>
					</DetailsContainer>

					<DetailsContainer title="Dates">
						<DetailItem
							label="Release Date"
							bind:value={formDataByPage[selectedWikiPage].releaseDate}
							editable={true}
							type="text"
							placeholder="YYYY-MM-DD"
						/>
						{#if formDataByPage[selectedWikiPage].flb}
							<DetailItem
								label="FLB Date"
								bind:value={formDataByPage[selectedWikiPage].flbDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
							/>
						{/if}
						{#if formDataByPage[selectedWikiPage].ulb}
							<DetailItem
								label="ULB Date"
								bind:value={formDataByPage[selectedWikiPage].ulbDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
							/>
						{/if}
						{#if formDataByPage[selectedWikiPage].transcendence}
							<DetailItem
								label="Transcendence Date"
								bind:value={formDataByPage[selectedWikiPage].transcendenceDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
							/>
						{/if}
					</DetailsContainer>

					<DetailsContainer title="Links">
						<DetailItem
							label="Wiki (EN)"
							bind:value={formDataByPage[selectedWikiPage].wikiEn}
							editable={true}
							type="text"
							placeholder="Page name (e.g., Cosmic_Sword)"
							width="480px"
							hasLinkButton={true}
							linkUrl={buildWikiEnUrl(formDataByPage[selectedWikiPage].wikiEn)}
						/>
						<DetailItem
							label="Wiki (JP)"
							bind:value={formDataByPage[selectedWikiPage].wikiJa}
							editable={true}
							type="text"
							placeholder="Japanese page name"
							width="480px"
							hasLinkButton={true}
							linkUrl={buildWikiJaUrl(formDataByPage[selectedWikiPage].wikiJa, 'weapon')}
						/>
						<DetailItem
							label="Gamewith"
							bind:value={formDataByPage[selectedWikiPage].gamewith}
							editable={true}
							type="text"
							placeholder="Article ID (e.g., 519325)"
							width="480px"
							hasLinkButton={true}
							linkUrl={buildGamewithUrl(formDataByPage[selectedWikiPage].gamewith)}
						/>
						<DetailItem
							label="Kamigame"
							bind:value={formDataByPage[selectedWikiPage].kamigame}
							editable={true}
							type="text"
							placeholder="Japanese name (e.g., 神刃エクス・アシャワン)"
							width="480px"
							hasLinkButton={true}
							linkUrl={buildKamigameUrl(formDataByPage[selectedWikiPage].kamigame, 'weapon', formDataByPage[selectedWikiPage].rarity)}
						/>
					</DetailsContainer>
				</section>
			{/if}
		{/if}
	{/if}
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

	.input-phase {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.input-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.wiki-inputs {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.input-row {
		display: flex;
		gap: spacing.$unit;
		align-items: center;
	}

	.remove-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: layout.$input-corner;
		color: var(--text-secondary);
		cursor: pointer;
		flex-shrink: 0;

		&:hover {
			background: var(--background);
			color: var(--text-primary);
		}

		:global(svg) {
			fill: currentColor;
		}
	}

	.hint {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
	}

	.error {
		color: colors.$error;
		font-size: typography.$font-small;
		margin: spacing.$unit 0;
	}

	.fetch-button {
		display: flex;
		justify-content: flex-end;
		margin-top: spacing.$unit-2x;
	}

	.entity-selector-container {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--separator-bg);
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

	.entity-error,
	.entity-loading {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);

		h3 {
			margin: 0 0 spacing.$unit 0;
			color: colors.$error;
		}

		p {
			margin: 0;
		}
	}
</style>
