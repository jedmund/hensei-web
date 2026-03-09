
<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { entityAdapter, type ParsedCharacterData } from '$lib/api/adapters/entity.adapter'
	import { fetchWikiPages, buildWikiDataMap } from '$lib/api/wiki'
	import { getGameCdnCharacterImage, getPlaceholderImage } from '$lib/utils/images'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import { getRarityPrefix } from '$lib/utils/rarity'

	// Components
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
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
		parsedData?: ParsedCharacterData
		wikiRaw?: string
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

	// Empty character for form sections
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
			// Auto-generate kamigame: "Name (JP)" for characters (no rarity prefix)
			formData.kamigame = nameJp
		}
	})

	// Entity tabs for TabbedEntitySelector
	const entityTabs = $derived<EntityTab[]>(
		Array.from(entities.entries()).map(([wikiPage, entity]) => ({
			wikiPage,
			granblueId: entity.granblueId,
			status: entity.status,
			imageUrl: entity.granblueId
				? getGameCdnCharacterImage(entity.granblueId)
				: getPlaceholderImage('character', 'square'),
			error: entity.error,
			saved: savedEntities.has(wikiPage)
		}))
	)

	// Initialize empty form data for an entity
	function createEmptyFormData(wikiPage: string, parsedData?: ParsedCharacterData) {
		return {
			name: parsedData?.nameEn ?? '',
			nameJp: parsedData?.nameJp ?? '',
			granblueId: parsedData?.granblueId ?? '',
			characterId: parsedData?.characterId?.join(', ') ?? '',
			rarity: parsedData?.rarity ?? 3,
			element: parsedData?.element ?? 0,
			race1: parsedData?.race1 ?? null,
			race2: parsedData?.race2 ?? null,
			gender: parsedData?.gender ?? 0,
			proficiency1: parsedData?.proficiency1 ?? 0,
			proficiency2: parsedData?.proficiency2 ?? 0,
			season: parsedData?.season ?? (null as number | null),
			series: parsedData?.series ?? ([] as number[]),
			minHp: parsedData?.minHp ?? 0,
			maxHp: parsedData?.maxHp ?? 0,
			maxHpFlb: parsedData?.maxHpFlb ?? 0,
			maxHpUlb: 0,
			minAtk: parsedData?.minAtk ?? 0,
			maxAtk: parsedData?.maxAtk ?? 0,
			maxAtkFlb: parsedData?.maxAtkFlb ?? 0,
			maxAtkUlb: 0,
			baseDa: 0,
			baseTa: 0,
			ougiRatio: 0,
			ougiRatioFlb: 0,
			flb: parsedData?.flb ?? false,
			ulb: parsedData?.ulb ?? false,
			transcendence: false,
			special: false,
			releaseDate: parsedData?.releaseDate ?? '',
			flbDate: parsedData?.flbDate ?? '',
			ulbDate: parsedData?.ulbDate ?? '',
			wikiEn: wikiPage ? wikiPage.replace(/ /g, '_') : '',
			wikiJa: '',
			gamewith: parsedData?.gamewith ?? '',
			kamigame: parsedData?.kamigame ?? '',
			nicknamesEn: [] as string[],
			nicknamesJp: [] as string[]
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
			const response = await entityAdapter.batchPreviewCharacters(finalPages, wikiData)

			// Update entities with results
			const updatedEntities = new Map<string, EntityState>()
			response.results.forEach((result) => {
				updatedEntities.set(result.wikiPage, {
					wikiPage: result.wikiPage,
					status: result.status,
					granblueId: result.granblueId,
					parsedData: result.parsedData,
					wikiRaw: result.wikiRaw,
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
		const entity = entities.get(selectedWikiPage)

		isSaving = true
		saveError = null

		try {
			const payload = {
				granblue_id: formData.granblueId,
				name_en: formData.name,
				name_jp: formData.nameJp,
				character_id:
					formData.characterId.trim() === ''
						? []
						: formData.characterId
								.split(',')
								.map((id: string) => Number(id.trim()))
								.filter((id: number) => !isNaN(id)),
				rarity: formData.rarity,
				element: formData.element,
				race1: formData.race1,
				race2: formData.race2,
				gender: formData.gender,
				proficiency1: formData.proficiency1,
				proficiency2: formData.proficiency2,
				season: formData.season === 0 ? null : formData.season,
				series: formData.series,
				min_hp: formData.minHp,
				max_hp: formData.maxHp,
				max_hp_flb: formData.maxHpFlb,
				max_hp_ulb: formData.maxHpUlb,
				min_atk: formData.minAtk,
				max_atk: formData.maxAtk,
				max_atk_flb: formData.maxAtkFlb,
				max_atk_ulb: formData.maxAtkUlb,
				base_da: formData.baseDa,
				base_ta: formData.baseTa,
				ougi_ratio: formData.ougiRatio,
				ougi_ratio_flb: formData.ougiRatioFlb,
				flb: formData.flb,
				ulb: formData.ulb,
				special: formData.special,
				release_date: formData.releaseDate || null,
				flb_date: formData.flbDate || null,
				ulb_date: formData.ulbDate || null,
				wiki_en: formData.wikiEn,
				wiki_ja: formData.wikiJa,
				gamewith: formData.gamewith,
				kamigame: formData.kamigame,
				nicknames_en: formData.nicknamesEn,
				nicknames_jp: formData.nicknamesJp,
				wiki_raw: wikiRawByPage[selectedWikiPage] || undefined
			}

			const newCharacter = await entityAdapter.createCharacter(payload)
			// Trigger image download in background (don't await - it queues a job)
			entityAdapter.downloadCharacterImages(newCharacter.id).catch(console.error)
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
			saveError = 'Failed to save character. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/characters')
	}

	// Can save current entity
	const canSave = $derived.by(() => {
		if (!selectedWikiPage) return false
		const formData = formDataByPage[selectedWikiPage]
		if (!formData) return false
		return (
			formData.name.trim() !== '' &&
			formData.granblueId.trim() !== '' &&
			!savedEntities.has(selectedWikiPage)
		)
	})

	// All entities saved
	const allSaved = $derived(
		entityTabs.length > 0 &&
			entityTabs.filter((e) => e.status === 'success').every((e) => savedEntities.has(e.wikiPage))
	)
</script>

<PageMeta title={m.page_title_db_import({ type: 'Characters' })} description={m.page_desc_home()} />

<div class="page">
	<SidebarHeader title="Batch Import Characters">
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
					{isSaving ? 'Saving...' : 'Save Character'}
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
						<Input
							bind:value={wikiPagesInputs[index]}
							placeholder="Narmaya_(Summer)"
							contained
							fullWidth
						/>
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
				entityType="character"
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
					<CharacterMetadataSection
						character={emptyCharacter}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<CharacterUncapSection
						character={emptyCharacter}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<CharacterTaxonomySection
						character={emptyCharacter}
						editMode={true}
						bind:editData={formDataByPage[selectedWikiPage]}
					/>

					<CharacterStatsSection
						character={emptyCharacter}
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
					</DetailsContainer>

					<DetailsContainer title="Links">
						<DetailItem
							label="Wiki (EN)"
							bind:value={formDataByPage[selectedWikiPage].wikiEn}
							editable={true}
							type="text"
							placeholder="Page name (e.g., Narmaya)"
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
							linkUrl={buildWikiJaUrl(formDataByPage[selectedWikiPage].wikiJa, 'character')}
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
							placeholder="Slug (e.g., SSR闇フロレンス)"
							width="480px"
							hasLinkButton={true}
							linkUrl={buildKamigameUrl(formDataByPage[selectedWikiPage].kamigame, 'character')}
						/>
					</DetailsContainer>

					{#if selectedEntity?.wikiRaw}
						<DetailsContainer title="Raw Wiki Data">
							<div class="wiki-raw">
								<pre>{selectedEntity.wikiRaw}</pre>
							</div>
						</DetailsContainer>
					{/if}
				</section>
			{/if}
		{/if}
	{/if}
</div>

<style lang="scss">
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
		color: var(--danger);
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
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}

	.entity-error,
	.entity-loading {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);

		h3 {
			margin: 0 0 spacing.$unit 0;
			color: var(--danger);
		}

		p {
			margin: 0;
		}
	}

	.wiki-raw {
		padding: spacing.$unit;

		pre {
			margin: 0;
			padding: spacing.$unit;
			background: var(--card-bg);
			border-radius: layout.$item-corner-small;
			font-size: typography.$font-small;
			white-space: pre-wrap;
			word-break: break-word;
			max-height: 300px;
			overflow-y: auto;
		}
	}
</style>
