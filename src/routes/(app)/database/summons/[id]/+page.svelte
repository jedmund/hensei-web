<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'
	import SummonMetadataSection from '$lib/features/database/summons/sections/SummonMetadataSection.svelte'
	import SummonUncapSection from '$lib/features/database/summons/sections/SummonUncapSection.svelte'
	import SummonTaxonomySection from '$lib/features/database/summons/sections/SummonTaxonomySection.svelte'
	import SummonStatsSection from '$lib/features/database/summons/sections/SummonStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import { getSummonImage } from '$lib/utils/images'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const summonQuery = createQuery(() => ({
		...entityQueries.summon(data.summon?.id ?? ''),
		...withInitialData(data.summon)
	}))

	// Get summon from query
	const summon = $derived(summonQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit mode state
	let editMode = $state(false)
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	// Editable fields
	let editData = $state({
		name: summon?.name?.en || '',
		nameJp: summon?.name?.ja || '',
		granblueId: summon?.granblueId || '',
		rarity: summon?.rarity || 3,
		element: summon?.element || 0,
		series: summon?.series || '',
		minHp: summon?.hp?.minHp || 0,
		maxHp: summon?.hp?.maxHp || 0,
		maxHpFlb: summon?.hp?.maxHpFlb || 0,
		maxHpUlb: summon?.hp?.maxHpUlb || 0,
		maxHpTranscendence: summon?.hp?.maxHpXlb || 0,
		minAtk: summon?.atk?.minAtk || 0,
		maxAtk: summon?.atk?.maxAtk || 0,
		maxAtkFlb: summon?.atk?.maxAtkFlb || 0,
		maxAtkUlb: summon?.atk?.maxAtkUlb || 0,
		maxAtkTranscendence: summon?.atk?.maxAtkXlb || 0,
		maxLevel: 100,
		flb: summon?.uncap?.flb || false,
		ulb: summon?.uncap?.ulb || false,
		transcendence: summon?.uncap?.transcendence || false,
		subaura: summon?.subaura || false,
		limit: false,
		releaseDate: '',
		flbDate: '',
		ulbDate: '',
		transcendenceDate: '',
		wikiEn: '',
		wikiJa: '',
		gamewith: '',
		kamigame: '',
		nicknamesEn: [] as string[],
		nicknamesJp: [] as string[]
	})

	// Reset edit data when summon changes
	$effect(() => {
		if (summon) {
			editData = {
				name: summon.name?.en || '',
				nameJp: summon.name?.ja || '',
				granblueId: summon.granblueId || '',
				rarity: summon.rarity || 3,
				element: summon.element || 0,
				series: summon.series || '',
				minHp: summon.hp?.minHp || 0,
				maxHp: summon.hp?.maxHp || 0,
				maxHpFlb: summon.hp?.maxHpFlb || 0,
				maxHpUlb: summon.hp?.maxHpUlb || 0,
				maxHpTranscendence: summon.hp?.maxHpXlb || 0,
				minAtk: summon.atk?.minAtk || 0,
				maxAtk: summon.atk?.maxAtk || 0,
				maxAtkFlb: summon.atk?.maxAtkFlb || 0,
				maxAtkUlb: summon.atk?.maxAtkUlb || 0,
				maxAtkTranscendence: summon.atk?.maxAtkXlb || 0,
				maxLevel: 100,
				flb: summon.uncap?.flb || false,
				ulb: summon.uncap?.ulb || false,
				transcendence: summon.uncap?.transcendence || false,
				subaura: summon.subaura || false,
				limit: false,
				releaseDate: '',
				flbDate: '',
				ulbDate: '',
				transcendenceDate: '',
				wikiEn: '',
				wikiJa: '',
				gamewith: '',
				kamigame: '',
				nicknamesEn: [],
				nicknamesJp: []
			}
		}
	})

	function toggleEditMode() {
		editMode = !editMode
		saveError = null
		saveSuccess = false

		// Reset data when canceling
		if (!editMode && summon) {
			editData = {
				name: summon.name?.en || '',
				nameJp: summon.name?.ja || '',
				granblueId: summon.granblueId || '',
				rarity: summon.rarity || 3,
				element: summon.element || 0,
				series: summon.series || '',
				minHp: summon.hp?.minHp || 0,
				maxHp: summon.hp?.maxHp || 0,
				maxHpFlb: summon.hp?.maxHpFlb || 0,
				maxHpUlb: summon.hp?.maxHpUlb || 0,
				maxHpTranscendence: summon.hp?.maxHpXlb || 0,
				minAtk: summon.atk?.minAtk || 0,
				maxAtk: summon.atk?.maxAtk || 0,
				maxAtkFlb: summon.atk?.maxAtkFlb || 0,
				maxAtkUlb: summon.atk?.maxAtkUlb || 0,
				maxAtkTranscendence: summon.atk?.maxAtkXlb || 0,
				maxLevel: 100,
				flb: summon.uncap?.flb || false,
				ulb: summon.uncap?.ulb || false,
				transcendence: summon.uncap?.transcendence || false,
				subaura: summon.subaura || false,
				limit: false,
				releaseDate: '',
				flbDate: '',
				ulbDate: '',
				transcendenceDate: '',
				wikiEn: '',
				wikiJa: '',
				gamewith: '',
				kamigame: '',
				nicknamesEn: [],
				nicknamesJp: []
			}
		}
	}

	async function saveChanges() {
		if (!summon?.id) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			const payload = {
				name_en: editData.name,
				name_jp: editData.nameJp || undefined,
				granblue_id: editData.granblueId,
				rarity: editData.rarity,
				element: editData.element,
				series: editData.series || undefined,
				min_hp: editData.minHp,
				max_hp: editData.maxHp,
				max_hp_flb: editData.maxHpFlb,
				max_hp_ulb: editData.maxHpUlb,
				max_hp_xlb: editData.maxHpTranscendence,
				min_atk: editData.minAtk,
				max_atk: editData.maxAtk,
				max_atk_flb: editData.maxAtkFlb,
				max_atk_ulb: editData.maxAtkUlb,
				max_atk_xlb: editData.maxAtkTranscendence,
				max_level: editData.maxLevel,
				flb: editData.flb,
				ulb: editData.ulb,
				transcendence: editData.transcendence,
				subaura: editData.subaura,
				limit: editData.limit,
				release_date: editData.releaseDate || null,
				flb_date: editData.flbDate || null,
				ulb_date: editData.ulbDate || null,
				transcendence_date: editData.transcendenceDate || null,
				wiki_en: editData.wikiEn,
				wiki_ja: editData.wikiJa,
				gamewith: editData.gamewith,
				kamigame: editData.kamigame,
				nicknames_en: editData.nicknamesEn,
				nicknames_jp: editData.nicknamesJp
			}

			await entityAdapter.updateSummon(summon.id, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: ['summon', summon.id] })

			saveSuccess = true
			editMode = false

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

	// Helper function for summon grid image
	function getSummonGridImage(summon: any): string {
		return getSummonImage(summon?.granblueId, 'grid')
	}
</script>

<div>
	{#if summon}
		<DetailScaffold
			type="summon"
			item={summon}
			image={getSummonGridImage(summon)}
			showEdit={canEdit}
			{editMode}
			{isSaving}
			{saveSuccess}
			{saveError}
			onEdit={toggleEditMode}
			onSave={saveChanges}
			onCancel={toggleEditMode}
		>
			<section class="details">
				<SummonMetadataSection {summon} {editMode} bind:editData />
				<SummonUncapSection {summon} {editMode} bind:editData />
				<SummonTaxonomySection {summon} {editMode} bind:editData />
				<SummonStatsSection {summon} {editMode} bind:editData />

				{#if editMode}
					<DetailsContainer title="Nicknames">
						<DetailItem label="Nicknames (EN)">
							<TagInput bind:value={editData.nicknamesEn} placeholder="Add nickname..." />
						</DetailItem>
						<DetailItem label="Nicknames (JP)">
							<TagInput bind:value={editData.nicknamesJp} placeholder="ニックネーム..." />
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
				{/if}

				{#if !editMode}
					<div class="summon-abilities">
						<h3>Call Effect</h3>
						<div class="abilities-section">
							{#if summon.callName || summon.callDescription}
								<div class="ability-item">
									<h4 class="ability-name">{summon.callName || 'Call Effect'}</h4>
									<p class="ability-description">
										{summon.callDescription || 'No description available'}
									</p>
								</div>
							{:else}
								<p class="no-abilities">No call effect information available</p>
							{/if}
						</div>

						<h3>Aura Effect</h3>
						<div class="abilities-section">
							{#if summon.auraName || summon.auraDescription}
								<div class="ability-item">
									<h4 class="ability-name">{summon.auraName || 'Aura Effect'}</h4>
									<p class="ability-description">
										{summon.auraDescription || 'No description available'}
									</p>
								</div>
							{:else}
								<p class="no-abilities">No aura effect information available</p>
							{/if}
						</div>

						{#if summon.subAuraName || summon.subAuraDescription}
							<h3>Sub Aura Effect</h3>
							<div class="abilities-section">
								<div class="ability-item">
									<h4 class="ability-name">{summon.subAuraName || 'Sub Aura Effect'}</h4>
									<p class="ability-description">
										{summon.subAuraDescription || 'No description available'}
									</p>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Summon Not Found</h2>
			<p>The summon you're looking for could not be found.</p>
			<button onclick={() => goto('/database/summons')}>Back to Summons</button>
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
			padding: spacing.$unit-half spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.summon-abilities {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid #e5e5e5;

		&:last-child {
			border-bottom: none;
		}

		h3 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.abilities-section {
			margin-bottom: spacing.$unit * 2;

			&:last-child {
				margin-bottom: 0;
			}

			.ability-item {
				padding: spacing.$unit;
				background: #f8f9fa;
				border-radius: 4px;

				.ability-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: #333;
				}

				.ability-description {
					font-size: typography.$font-small;
					color: #666;
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-abilities {
				text-align: center;
				color: #666;
				font-style: italic;
				padding: spacing.$unit;
			}
		}
	}
</style>
