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
	import WeaponGachaSection from '$lib/features/database/weapons/sections/WeaponGachaSection.svelte'
	import WeaponForgeSection from '$lib/features/database/weapons/sections/WeaponForgeSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import { getWeaponGridImage } from '$lib/utils/images'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import { getElementLabel } from '$lib/utils/element'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const weaponQuery = createQuery(() => ({
		...entityQueries.weapon(data.weapon?.granblueId ?? ''),
		...withInitialData(data.weapon)
	}))

	// Get weapon from query
	const weapon = $derived(weaponQuery.data)

	// Always in edit mode
	const editMode = true

	// Element for button styling
	const elementName = $derived(
		getElementLabel(weapon?.element)?.toLowerCase() as
			| 'wind'
			| 'fire'
			| 'water'
			| 'earth'
			| 'dark'
			| 'light'
			| undefined
	)

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
		series: '',
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
		extraPrerequisite: '' as number | '',
		extra: false,
		limit: false,
		ax: false,
		promotions: [] as number[],
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
		recruits: '',
		// Forge chain fields
		forgedFrom: '' as string | null,
		forgeOrder: null as number | null
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
				// Extract series ID from object
				series: weapon.series?.id || '',
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
				extraPrerequisite: weapon.uncap?.extraPrerequisite ?? '',
				extra: weapon.extra || false,
				limit: Boolean(weapon.limit),
				ax: weapon.ax || false,
				promotions: weapon.promotions || [],
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
				recruits: typeof weapon.recruits === 'string' ? weapon.recruits : (weapon.recruits?.granblueId ?? ''),
				// Forge chain fields
				forgedFrom: weapon.forgedFrom?.granblueId || null,
				forgeOrder: weapon.forgeOrder ?? null
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
				extra_prerequisite: editData.extraPrerequisite === '' ? null : editData.extraPrerequisite,
				extra: editData.extra,
				limit: editData.limit,
				ax: editData.ax,
				promotions: editData.promotions,
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
				recruits: editData.recruits || undefined,
				// Forge chain fields
				forged_from: editData.forgedFrom || null,
				forge_order: editData.forgeOrder
			}

			await entityAdapter.updateWeapon(weapon.id, payload)

			// Invalidate TanStack Query cache and force immediate refetch
			await queryClient.invalidateQueries({
				queryKey: ['weapon', weapon.granblueId],
				refetchType: 'all'
			})

			// Navigate back to detail page
			goto(`/database/weapons/${weapon.granblueId}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	// Helper function for weapon grid image
	function getWeaponImage(weapon: any): string {
		return getWeaponGridImage(weapon?.granblueId, weapon?.element, weapon?.instanceElement)
	}
</script>

<div class="page">
	<DatabasePageHeader title="Edit Weapon" backHref={`/database/weapons/${weapon?.granblueId}`}>
		{#snippet rightAction()}
			<Button variant="element-ghost" element={elementName} size="small" onclick={saveChanges} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if weapon}
		<DetailScaffold
			type="weapon"
			item={weapon}
			image={getWeaponImage(weapon)}
			{editMode}
		>
			<section class="details">
				<WeaponMetadataSection {weapon} {editMode} bind:editData />
				<WeaponGachaSection {weapon} {editMode} bind:editData />
				<WeaponUncapSection {weapon} {editMode} bind:editData />
				<WeaponTaxonomySection {weapon} {editMode} bind:editData />
				<WeaponStatsSection {weapon} {editMode} bind:editData />
				<WeaponForgeSection {weapon} {editMode} bind:editData />

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
						placeholder="Page name (e.g., Cosmic_Sword)"
						width="480px"
						hasLinkButton={true}
						linkUrl={buildWikiEnUrl(editData.wikiEn)}
					/>
					<DetailItem
						label="Wiki (JP)"
						bind:value={editData.wikiJa}
						editable={true}
						type="text"
						placeholder="Japanese page name"
						width="480px"
						hasLinkButton={true}
						linkUrl={buildWikiJaUrl(editData.wikiJa, 'weapon')}
					/>
					<DetailItem
						label="Gamewith"
						bind:value={editData.gamewith}
						editable={true}
						type="text"
						placeholder="Article ID (e.g., 519325)"
						width="480px"
						hasLinkButton={true}
						linkUrl={buildGamewithUrl(editData.gamewith)}
					/>
					<DetailItem
						label="Kamigame"
						bind:value={editData.kamigame}
						editable={true}
						type="text"
						placeholder="Japanese name (e.g., 神刃エクス・アシャワン)"
						width="480px"
						hasLinkButton={true}
						linkUrl={buildKamigameUrl(editData.kamigame, 'weapon', editData.rarity)}
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
		border-radius: layout.$page-corner;
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
