<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { entityAdapter, type SummonSuggestions } from '$lib/api/adapters/entity.adapter'
	import { getSummonImage } from '$lib/utils/images'

	// Components
	import SummonUncapSection from '$lib/features/database/summons/sections/SummonUncapSection.svelte'
	import SummonTaxonomySection from '$lib/features/database/summons/sections/SummonTaxonomySection.svelte'
	import SummonStatsSection from '$lib/features/database/summons/sections/SummonStatsSection.svelte'
	import SummonMetadataSection from '$lib/features/database/summons/sections/SummonMetadataSection.svelte'
	import TabbedEntitySelector from '$lib/features/database/import/TabbedEntitySelector.svelte'
	import type { EntityTab } from '$lib/features/database/import/TabbedEntitySelector.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'

	import type { PageData } from './$types'

	// Internal entity state including loading status
	interface EntityState {
		wikiPage: string
		status: 'loading' | 'success' | 'error'
		granblueId?: string
		suggestions?: SummonSuggestions
		error?: string
	}

	let { data }: { data: PageData } = $props()

	// Input phase
	let wikiPagesInput = $state('')
	let isFetching = $state(false)
	let fetchError = $state<string | null>(null)

	// Fetched entities
	let entities = $state<Map<string, EntityState>>(new Map())
	let selectedWikiPage = $state<string | null>(null)

	// Form data per entity (keyed by wikiPage)
	let formDataMap = $state<Map<string, any>>(new Map())
	let dismissedSuggestionsMap = $state<Map<string, Set<string>>>(new Map())
	let savedEntities = $state<Set<string>>(new Set())

	// Saving state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Empty summon for form sections
	const emptySummon = {
		id: '',
		name: { en: '', jp: '' },
		granblueId: '',
		summonId: '',
		rarity: 3,
		element: 0,
		series: '',
		hp: { minHp: 0, maxHp: 0, maxHpFlb: 0, maxHpUlb: 0, maxHpXlb: 0 },
		atk: { minAtk: 0, maxAtk: 0, maxAtkFlb: 0, maxAtkUlb: 0, maxAtkXlb: 0 },
		uncap: { flb: false, ulb: false, transcendence: false },
		subaura: false,
		limit: false,
		maxLevel: 100
	}

	// Get selected entity data
	const selectedEntity = $derived(selectedWikiPage ? entities.get(selectedWikiPage) : null)

	// Entity tabs for TabbedEntitySelector
	const entityTabs = $derived<EntityTab[]>(
		Array.from(entities.entries()).map(([wikiPage, entity]) => ({
			wikiPage,
			granblueId: entity.granblueId,
			status: entity.status,
			imageUrl: entity.granblueId
				? getSummonImage(entity.granblueId, 'square')
				: '/images/placeholders/placeholder-summon-square.png',
			error: entity.error,
			saved: savedEntities.has(wikiPage)
		}))
	)

	// Initialize empty form data for an entity
	function createEmptyFormData(wikiPage: string, suggestions?: SummonSuggestions) {
		return {
			name: suggestions?.nameEn ?? '',
			nameJp: suggestions?.nameJp ?? '',
			granblue_id: suggestions?.granblueId ?? '',
			summonId: '',
			rarity: suggestions?.rarity ?? 3,
			element: suggestions?.element ?? 0,
			series: '',
			promotions: [] as number[],
			minHp: suggestions?.minHp ?? 0,
			maxHp: suggestions?.maxHp ?? 0,
			maxHpFlb: suggestions?.maxHpFlb ?? 0,
			maxHpUlb: 0,
			maxHpTranscendence: 0,
			minAtk: suggestions?.minAtk ?? 0,
			maxAtk: suggestions?.maxAtk ?? 0,
			maxAtkFlb: suggestions?.maxAtkFlb ?? 0,
			maxAtkUlb: 0,
			maxAtkTranscendence: 0,
			maxLevel: 100,
			flb: suggestions?.flb ?? false,
			ulb: suggestions?.ulb ?? false,
			transcendence: false,
			subaura: suggestions?.subaura ?? false,
			limit: false,
			releaseDate: suggestions?.releaseDate ?? '',
			flbDate: suggestions?.flbDate ?? '',
			ulbDate: suggestions?.ulbDate ?? '',
			transcendenceDate: '',
			wikiEn: wikiPage ? `https://gbf.wiki/${wikiPage.replace(/ /g, '_')}` : '',
			wikiJa: '',
			gamewith: suggestions?.gamewith ?? '',
			kamigame: suggestions?.kamigame ?? '',
			nicknamesEn: [] as string[],
			nicknamesJp: [] as string[]
		}
	}

	// Fetch wiki data for entered pages
	async function fetchWikiData() {
		const pages = wikiPagesInput
			.split(',')
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
			const response = await entityAdapter.batchPreviewSummons(pages)

			// Update entities with results
			const updatedEntities = new Map<string, EntityState>()
			response.results.forEach((result) => {
				updatedEntities.set(result.wikiPage, {
					wikiPage: result.wikiPage,
					status: result.status,
					granblueId: result.granblueId,
					suggestions: result.suggestions,
					error: result.error
				})

				// Create form data for successful results
				if (result.status === 'success') {
					const formData = createEmptyFormData(result.wikiPage, result.suggestions)
					formDataMap.set(result.wikiPage, formData)
					dismissedSuggestionsMap.set(result.wikiPage, new Set<string>())
				}
			})
			entities = updatedEntities

			// Update formDataMap and dismissedSuggestionsMap to trigger reactivity
			formDataMap = new Map(formDataMap)
			dismissedSuggestionsMap = new Map(dismissedSuggestionsMap)
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

	// Accept a suggestion
	function handleAcceptSuggestion(field: string, value: any) {
		if (!selectedWikiPage) return

		const formData = formDataMap.get(selectedWikiPage)
		if (formData) {
			formData[field] = value
			formDataMap = new Map(formDataMap)
		}
	}

	// Dismiss a suggestion
	function handleDismissSuggestion(field: string) {
		if (!selectedWikiPage) return

		const dismissed = dismissedSuggestionsMap.get(selectedWikiPage) ?? new Set()
		dismissed.add(field)
		dismissedSuggestionsMap = new Map(dismissedSuggestionsMap)
	}

	// Save current entity
	async function saveCurrentEntity() {
		if (!selectedWikiPage) return
		const formData = formDataMap.get(selectedWikiPage)
		if (!formData) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				granblue_id: formData.granblue_id,
				name_en: formData.name,
				name_jp: formData.nameJp,
				summon_id: formData.summonId || undefined,
				rarity: formData.rarity,
				element: formData.element,
				series: formData.series || undefined,
				promotions: formData.promotions,
				min_hp: formData.minHp,
				max_hp: formData.maxHp,
				max_hp_flb: formData.maxHpFlb,
				max_hp_ulb: formData.maxHpUlb,
				max_hp_xlb: formData.maxHpTranscendence,
				min_atk: formData.minAtk,
				max_atk: formData.maxAtk,
				max_atk_flb: formData.maxAtkFlb,
				max_atk_ulb: formData.maxAtkUlb,
				max_atk_xlb: formData.maxAtkTranscendence,
				max_level: formData.maxLevel,
				flb: formData.flb,
				ulb: formData.ulb,
				transcendence: formData.transcendence,
				subaura: formData.subaura,
				limit: formData.limit,
				release_date: formData.releaseDate || null,
				flb_date: formData.flbDate || null,
				ulb_date: formData.ulbDate || null,
				transcendence_date: formData.transcendenceDate || null,
				wiki_en: formData.wikiEn,
				wiki_ja: formData.wikiJa,
				gamewith: formData.gamewith,
				kamigame: formData.kamigame,
				nicknames_en: formData.nicknamesEn,
				nicknames_jp: formData.nicknamesJp
			}

			await entityAdapter.createSummon(payload)
			savedEntities.add(selectedWikiPage)
			savedEntities = new Set(savedEntities)

			// Select next unsaved entity
			const unsaved = entityTabs.find((e) => !savedEntities.has(e.wikiPage) && e.status === 'success')
			if (unsaved) {
				selectedWikiPage = unsaved.wikiPage
			}
		} catch (error) {
			saveError = 'Failed to save summon. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/summons')
	}

	// Can save current entity
	const canSave = $derived.by(() => {
		if (!selectedWikiPage) return false
		const formData = formDataMap.get(selectedWikiPage)
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

<div class="page">
	<SidebarHeader title="Batch Import Summons">
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
					{isSaving ? 'Saving...' : 'Save Summon'}
				</Button>
			{/if}
		{/snippet}
	</SidebarHeader>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<!-- Input phase -->
	{#if entities.size === 0}
		<div class="input-phase">
			<DetailsContainer title="Enter Wiki Pages">
				<div class="wiki-input">
					<Input
						bind:value={wikiPagesInput}
						placeholder="Bahamut, Lucifer, Zeus"
						contained
					/>
					<p class="hint">Enter wiki page names separated by commas (up to 10)</p>
				</div>
				{#if fetchError}
					<p class="error">{fetchError}</p>
				{/if}
				<div class="fetch-button">
					<Button variant="primary" onclick={fetchWikiData} disabled={isFetching}>
						{isFetching ? 'Fetching...' : 'Fetch Wiki Data'}
					</Button>
				</div>
			</DetailsContainer>
		</div>
	{:else}
		<!-- Entity selector -->
		<div class="entity-selector-container">
			<TabbedEntitySelector
				entities={entityTabs}
				{selectedWikiPage}
				onSelect={handleSelectEntity}
				entityType="summon"
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
			{:else if selectedWikiPage && formDataMap.has(selectedWikiPage)}
				{@const formData = formDataMap.get(selectedWikiPage)!}
				{@const suggestions = selectedEntity.suggestions}
				{@const dismissed = dismissedSuggestionsMap.get(selectedWikiPage) ?? new Set<string>()}
				<section class="details">
					<DetailsContainer title="Basic Info">
						<SuggestionDetailItem
							label="Name (EN)"
							bind:value={formData.name}
							editable={true}
							type="text"
							placeholder="Summon name"
							suggestion={suggestions?.nameEn}
							dismissedSuggestion={dismissed.has('name')}
							onAcceptSuggestion={() => handleAcceptSuggestion('name', suggestions?.nameEn)}
							onDismissSuggestion={() => handleDismissSuggestion('name')}
						/>
						<SuggestionDetailItem
							label="Name (JP)"
							bind:value={formData.nameJp}
							editable={true}
							type="text"
							placeholder="召喚石名"
							suggestion={suggestions?.nameJp}
							dismissedSuggestion={dismissed.has('nameJp')}
							onAcceptSuggestion={() => handleAcceptSuggestion('nameJp', suggestions?.nameJp)}
							onDismissSuggestion={() => handleDismissSuggestion('nameJp')}
						/>
						<DetailItem
							label="Summon ID"
							sublabel="Internal game identifier (if known)"
							bind:value={formData.summonId}
							editable={true}
							type="text"
							placeholder="Optional"
						/>
					</DetailsContainer>

					<SummonMetadataSection
						summon={emptySummon}
						editMode={true}
						editData={formData}
						{suggestions}
						dismissedSuggestions={dismissed}
						onAcceptSuggestion={handleAcceptSuggestion}
						onDismissSuggestion={handleDismissSuggestion}
					/>

					<SummonUncapSection
						summon={emptySummon}
						editMode={true}
						editData={formData}
						{suggestions}
						dismissedSuggestions={dismissed}
						onAcceptSuggestion={handleAcceptSuggestion}
						onDismissSuggestion={handleDismissSuggestion}
					/>

					<SummonTaxonomySection
						summon={emptySummon}
						editMode={true}
						editData={formData}
						{suggestions}
						dismissedSuggestions={dismissed}
						onAcceptSuggestion={handleAcceptSuggestion}
						onDismissSuggestion={handleDismissSuggestion}
					/>

					<SummonStatsSection
						summon={emptySummon}
						editMode={true}
						editData={formData}
						{suggestions}
						dismissedSuggestions={dismissed}
						onAcceptSuggestion={handleAcceptSuggestion}
						onDismissSuggestion={handleDismissSuggestion}
					/>

					<DetailsContainer title="Nicknames">
						<DetailItem label="Nicknames (EN)">
							<TagInput bind:value={formData.nicknamesEn} placeholder="Add nickname..." contained />
						</DetailItem>
						<DetailItem label="Nicknames (JP)">
							<TagInput bind:value={formData.nicknamesJp} placeholder="ニックネーム..." contained />
						</DetailItem>
					</DetailsContainer>

					<DetailsContainer title="Dates">
						<SuggestionDetailItem
							label="Release Date"
							bind:value={formData.releaseDate}
							editable={true}
							type="text"
							placeholder="YYYY-MM-DD"
							suggestion={suggestions?.releaseDate}
							dismissedSuggestion={dismissed.has('releaseDate')}
							onAcceptSuggestion={() => handleAcceptSuggestion('releaseDate', suggestions?.releaseDate)}
							onDismissSuggestion={() => handleDismissSuggestion('releaseDate')}
						/>
						{#if formData.flb}
							<SuggestionDetailItem
								label="FLB Date"
								bind:value={formData.flbDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
								suggestion={suggestions?.flbDate}
								dismissedSuggestion={dismissed.has('flbDate')}
								onAcceptSuggestion={() => handleAcceptSuggestion('flbDate', suggestions?.flbDate)}
								onDismissSuggestion={() => handleDismissSuggestion('flbDate')}
							/>
						{/if}
						{#if formData.ulb}
							<SuggestionDetailItem
								label="ULB Date"
								bind:value={formData.ulbDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
								suggestion={suggestions?.ulbDate}
								dismissedSuggestion={dismissed.has('ulbDate')}
								onAcceptSuggestion={() => handleAcceptSuggestion('ulbDate', suggestions?.ulbDate)}
								onDismissSuggestion={() => handleDismissSuggestion('ulbDate')}
							/>
						{/if}
						{#if formData.transcendence}
							<DetailItem
								label="Transcendence Date"
								bind:value={formData.transcendenceDate}
								editable={true}
								type="text"
								placeholder="YYYY-MM-DD"
							/>
						{/if}
					</DetailsContainer>

					<DetailsContainer title="Links">
						<DetailItem
							label="Wiki (EN)"
							bind:value={formData.wikiEn}
							editable={true}
							type="text"
							placeholder="https://gbf.wiki/..."
							width="480px"
						/>
						<DetailItem
							label="Wiki (JP)"
							bind:value={formData.wikiJa}
							editable={true}
							type="text"
							placeholder="https://gbf-wiki.com/..."
							width="480px"
						/>
						<SuggestionDetailItem
							label="Gamewith"
							bind:value={formData.gamewith}
							editable={true}
							type="text"
							placeholder="https://..."
							width="480px"
							suggestion={suggestions?.gamewith}
							dismissedSuggestion={dismissed.has('gamewith')}
							onAcceptSuggestion={() => handleAcceptSuggestion('gamewith', suggestions?.gamewith)}
							onDismissSuggestion={() => handleDismissSuggestion('gamewith')}
						/>
						<SuggestionDetailItem
							label="Kamigame"
							bind:value={formData.kamigame}
							editable={true}
							type="text"
							placeholder="https://..."
							width="480px"
							suggestion={suggestions?.kamigame}
							dismissedSuggestion={dismissed.has('kamigame')}
							onAcceptSuggestion={() => handleAcceptSuggestion('kamigame', suggestions?.kamigame)}
							onDismissSuggestion={() => handleDismissSuggestion('kamigame')}
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
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.input-phase {
		padding: spacing.$unit-2x;
	}

	.wiki-input {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.hint {
		font-size: typography.$font-small;
		color: colors.$grey-50;
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
		border-bottom: 1px solid colors.$grey-90;
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
		color: colors.$grey-50;

		h3 {
			margin: 0 0 spacing.$unit 0;
			color: colors.$error;
		}

		p {
			margin: 0;
		}
	}
</style>
