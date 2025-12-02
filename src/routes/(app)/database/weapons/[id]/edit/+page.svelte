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
	import WeaponMetadataSection from '$lib/features/database/weapons/sections/WeaponMetadataSection.svelte'
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import { getWeaponGridImage } from '$lib/utils/images'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const weaponQuery = createQuery(() => ({
		...entityQueries.weapon(data.weapon?.id ?? ''),
		...withInitialData(data.weapon)
	}))

	// Get weapon from query
	const weapon = $derived(weaponQuery.data)

	// Always in edit mode
	const editMode = true

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Editable fields - initialized from weapon data
	let editData = $state({
		name: '',
		nameJp: '',
		granblue_id: '',
		rarity: 3,
		element: 0,
		proficiency: 0,
		series: 0,
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
		flb: false,
		ulb: false,
		transcendence: false,
		extra: false,
		limit: false,
		ax: false,
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
		recruits: ''
	})

	// Populate edit data when weapon loads
	$effect(() => {
		if (weapon) {
			editData = {
				name: weapon.name?.en || '',
				nameJp: weapon.name?.ja || '',
				granblue_id: weapon.granblueId || '',
				rarity: weapon.rarity || 3,
				element: weapon.element || 0,
				proficiency: weapon.proficiency || 0,
				series: weapon.series || 0,
				minHp: weapon.hp?.minHp || 0,
				maxHp: weapon.hp?.maxHp || 0,
				maxHpFlb: weapon.hp?.maxHpFlb || 0,
				maxHpUlb: weapon.hp?.maxHpUlb || 0,
				minAtk: weapon.atk?.minAtk || 0,
				maxAtk: weapon.atk?.maxAtk || 0,
				maxAtkFlb: weapon.atk?.maxAtkFlb || 0,
				maxAtkUlb: weapon.atk?.maxAtkUlb || 0,
				maxLevel: weapon.maxLevel || 100,
				maxSkillLevel: weapon.maxSkillLevel || 10,
				maxAwakeningLevel: weapon.maxAwakeningLevel || 0,
				flb: weapon.uncap?.flb || false,
				ulb: weapon.uncap?.ulb || false,
				transcendence: weapon.uncap?.transcendence || false,
				extra: false,
				limit: false,
				ax: weapon.ax || false,
				releaseDate: weapon.releaseDate || '',
				flbDate: weapon.flbDate || '',
				ulbDate: weapon.ulbDate || '',
				transcendenceDate: weapon.transcendenceDate || '',
				wikiEn: weapon.wiki?.en || '',
				wikiJa: weapon.wiki?.ja || '',
				gamewith: weapon.gamewith || '',
				kamigame: weapon.kamigame || '',
				nicknamesEn: weapon.nicknames?.en || [],
				nicknamesJp: weapon.nicknames?.ja || [],
				recruits: weapon.recruits || ''
			}
		}
	})

	async function saveChanges() {
		if (!weapon?.id) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.name,
				name_jp: editData.nameJp || undefined,
				granblue_id: editData.granblue_id,
				rarity: editData.rarity,
				element: editData.element,
				proficiency: editData.proficiency,
				series: editData.series || undefined,
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
				flb: editData.flb,
				ulb: editData.ulb,
				transcendence: editData.transcendence,
				extra: editData.extra,
				limit: editData.limit,
				ax: editData.ax,
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
				recruits: editData.recruits || undefined
			}

			await entityAdapter.updateWeapon(weapon.id, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: ['weapon', weapon.id] })

			// Navigate back to detail page
			goto(`/database/weapons/${weapon.id}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/weapons/${weapon?.id}`)
	}

	// Helper function for weapon grid image
	function getWeaponImage(weapon: any): string {
		return getWeaponGridImage(weapon?.granblueId, weapon?.element, weapon?.instanceElement)
	}
</script>

<div class="page">
	{#if weapon}
		<DetailScaffold
			type="weapon"
			item={weapon}
			image={getWeaponImage(weapon)}
			showEdit={true}
			{editMode}
			{isSaving}
			{saveError}
			onSave={saveChanges}
			onCancel={handleCancel}
		>
			<section class="details">
				<WeaponMetadataSection {weapon} {editMode} bind:editData />
				<WeaponUncapSection {weapon} {editMode} bind:editData />
				<WeaponTaxonomySection {weapon} {editMode} bind:editData />
				<WeaponStatsSection {weapon} {editMode} bind:editData />

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

				<DetailsContainer title="Character">
					<DetailItem
						label="Recruits"
						sublabel="Character ID this weapon recruits"
						bind:value={editData.recruits}
						editable={true}
						type="text"
						placeholder="Character ID..."
					/>
				</DetailsContainer>
			</section>
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Weapon Not Found</h2>
			<p>The weapon you're looking for could not be found.</p>
			<button onclick={() => goto('/database/weapons')}>Back to Weapons</button>
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
