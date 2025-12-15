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
		...entityQueries.summon(data.summon?.granblueId ?? ''),
		...withInitialData(data.summon)
	}))

	// Get summon from query
	const summon = $derived(summonQuery.data)

	// Always in edit mode
	const editMode = true

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Editable fields - initialized from summon data
	let editData = $state({
		name: '',
		nameJp: '',
		granblue_id: '',
		rarity: 3,
		element: 0,
		series: '',
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		maxHpUlb: 0,
		maxHpTranscendence: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		maxAtkUlb: 0,
		maxAtkTranscendence: 0,
		maxLevel: 100,
		flb: false,
		ulb: false,
		transcendence: false,
		subaura: false,
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
		nicknamesJp: [] as string[],
		promotions: [] as number[]
	})

	// Populate edit data when summon loads
	$effect(() => {
		if (summon) {
			editData = {
				name: summon.name?.en || '',
				nameJp: summon.name?.ja || '',
				granblue_id: summon.granblueId || '',
				rarity: summon.rarity || 3,
				element: summon.element || 0,
				series: summon.series?.id || '',
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
				releaseDate: summon.releaseDate || '',
				flbDate: summon.flbDate || '',
				ulbDate: summon.ulbDate || '',
				transcendenceDate: summon.transcendenceDate || '',
				wikiEn: summon.wiki?.en || '',
				wikiJa: summon.wiki?.ja || '',
				gamewith: summon.gamewith || '',
				kamigame: summon.kamigame || '',
				nicknamesEn: summon.nicknames?.en || [],
				nicknamesJp: summon.nicknames?.ja || [],
				promotions: summon.promotions || []
			}
		}
	})

	async function saveChanges() {
		if (!summon?.id) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.name,
				name_jp: editData.nameJp || undefined,
				granblue_id: editData.granblue_id,
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
				nicknames_jp: editData.nicknamesJp,
				promotions: editData.promotions
			}

			await entityAdapter.updateSummon(summon.id, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: ['summon', summon.granblueId] })

			// Navigate back to detail page
			goto(`/database/summons/${summon.granblueId}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/summons/${summon?.granblueId}`)
	}

	// Helper function for summon grid image
	function getSummonGridImage(summon: any): string {
		return getSummonImage(summon?.granblueId, 'grid')
	}
</script>

<div class="page">
	{#if summon}
		<DetailScaffold
			type="summon"
			item={summon}
			image={getSummonGridImage(summon)}
			showEdit={true}
			{editMode}
			{isSaving}
			{saveError}
			onSave={saveChanges}
			onCancel={handleCancel}
		>
			<section class="details">
				<SummonMetadataSection {summon} {editMode} bind:editData />
				<SummonUncapSection {summon} {editMode} bind:editData />
				<SummonTaxonomySection {summon} {editMode} bind:editData />
				<SummonStatsSection {summon} {editMode} bind:editData />

				<DetailsContainer title="Nicknames">
					<DetailItem label="Nicknames (EN)">
						<TagInput bind:value={editData.nicknamesEn} placeholder="Add nickname..." contained />
					</DetailItem>
					<DetailItem label="Nicknames (JP)">
						<TagInput
							bind:value={editData.nicknamesJp}
							placeholder="ニックネームを入力"
							contained
						/>
					</DetailItem>
				</DetailsContainer>

				<DetailsContainer title="Dates">
					<DetailItem
						label="Release Date"
						bind:value={editData.releaseDate}
						editable={true}
						type="date"
					/>
					{#if editData.flb}
						<DetailItem
							label="FLB Date"
							bind:value={editData.flbDate}
							editable={true}
							type="date"
						/>
					{/if}
					{#if editData.ulb}
						<DetailItem
							label="ULB Date"
							bind:value={editData.ulbDate}
							editable={true}
							type="date"
						/>
					{/if}
					{#if editData.transcendence}
						<DetailItem
							label="Transcendence Date"
							bind:value={editData.transcendenceDate}
							editable={true}
							type="date"
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

	.page {
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

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
</style>
