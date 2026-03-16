
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import { getCharacterImage } from '$lib/utils/images'
	import { CHARACTER_SERIES_NAMES } from '$lib/types/enums'
	import { getElementLabel } from '$lib/utils/element'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	// Types
	import type { PageData } from './$types'

	// Create reverse mapping from series name to integer
	const SERIES_NAME_TO_INT: Record<string, number> = Object.fromEntries(
		Object.entries(CHARACTER_SERIES_NAMES).map(([key, name]) => [name, Number(key)])
	)

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data — style swap variant
	const characterQuery = createQuery(() => ({
		...entityQueries.character(data.character?.granblueId ?? '', { styleSwap: true }),
		...withInitialData(data.character)
	}))

	// Get character from query
	const character = $derived(characterQuery.data)

	// Always in edit mode
	const editMode = true

	// Element for button styling
	const elementName = $derived(
		getElementLabel(character?.element)?.toLowerCase() as
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

	// Editable fields - initialized from character data
	let editData = $state({
		name: '',
		nameJp: '',
		granblueId: '',
		characterId: '',
		rarity: 1,
		element: 0,
		race1: null as number | null,
		race2: null as number | null,
		gender: 0,
		proficiency1: 0,
		proficiency2: 0,
		season: 0,
		series: [] as number[],
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
		flb: false,
		ulb: false,
		transcendence: false,
		special: false,
		styleSwap: false,
		styleNameEn: '' as string,
		styleNameJp: '' as string,
		releaseDate: '',
		flbDate: '',
		ulbDate: '',
		nicknamesEn: [] as string[],
		nicknamesJp: [] as string[],
		wikiEn: '',
		wikiJa: '',
		gamewith: '',
		kamigame: ''
	})

	// Helper to convert series to number array
	function seriesAsNumbers(
		series: number[] | Array<{ id: string; name?: { en?: string } }> | undefined
	): number[] {
		if (!series || series.length === 0) return []
		const first = series[0]
		if (typeof first === 'object' && first !== null && 'id' in first) {
			return (series as Array<{ id: string; name?: { en?: string } }>)
				.map((s) => {
					const name = s.name?.en
					return name ? SERIES_NAME_TO_INT[name] : undefined
				})
				.filter((n): n is number => n !== undefined)
		}
		return series as number[]
	}

	// Populate edit data when character loads
	$effect(() => {
		if (character) {
			editData = {
				name: character.name?.en || '',
				nameJp: character.name?.ja || '',
				granblueId: character.granblueId || '',
				characterId: character.characterId?.join(', ') || '',
				rarity: character.rarity || 1,
				element: character.element || 0,
				race1: character.race?.[0] ?? null,
				race2: character.race?.[1] ?? null,
				gender: character.gender || 0,
				proficiency1: character.proficiency?.[0] || 0,
				proficiency2: character.proficiency?.[1] || 0,
				season: character.season || 0,
				series: seriesAsNumbers(character.series),
				minHp: character.hp?.minHp || 0,
				maxHp: character.hp?.maxHp || 0,
				maxHpFlb: character.hp?.maxHpFlb || 0,
				maxHpUlb: character.hp?.maxHpUlb || 0,
				minAtk: character.atk?.minAtk || 0,
				maxAtk: character.atk?.maxAtk || 0,
				maxAtkFlb: character.atk?.maxAtkFlb || 0,
				maxAtkUlb: character.atk?.maxAtkUlb || 0,
				baseDa: character.baseDa || 0,
				baseTa: character.baseTa || 0,
				ougiRatio: character.ougiRatio?.ougiRatio || 0,
				ougiRatioFlb: character.ougiRatio?.ougiRatioFlb || 0,
				flb: character.uncap?.flb || false,
				ulb: character.uncap?.ulb || false,
				transcendence: character.uncap?.transcendence || false,
				special: character.special || false,
				styleSwap: character.styleSwap || false,
				styleNameEn: character.styleName?.en || '',
				styleNameJp: character.styleName?.ja || '',
				releaseDate: character.releaseDate || '',
				flbDate: character.flbDate || '',
				ulbDate: character.ulbDate || '',
				nicknamesEn: character.nicknames?.en || [],
				nicknamesJp: character.nicknames?.ja || [],
				wikiEn: character.wiki?.en || '',
				wikiJa: character.wiki?.ja || '',
				gamewith: character.gamewith || '',
				kamigame: character.kamigame || ''
			}
		}
	})

	async function saveChanges() {
		if (!character?.id) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.name,
				name_jp: editData.nameJp,
				granblue_id: editData.granblueId,
				character_id:
					editData.characterId.trim() === ''
						? []
						: editData.characterId
								.split(',')
								.map((id) => Number(id.trim()))
								.filter((id) => !isNaN(id)),
				rarity: editData.rarity,
				element: editData.element,
				race1: editData.race1,
				race2: editData.race2,
				gender: editData.gender,
				proficiency1: editData.proficiency1,
				proficiency2: editData.proficiency2,
				season: editData.season || undefined,
				series: editData.series,
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
				flb: editData.flb,
				ulb: editData.ulb,
				special: editData.special,
				style_swap: editData.styleSwap,
				style_name_en: editData.styleNameEn || undefined,
				style_name_jp: editData.styleNameJp || undefined,
				release_date: editData.releaseDate || undefined,
				flb_date: editData.flbDate || undefined,
				ulb_date: editData.ulbDate || undefined,
				nicknames_en: editData.nicknamesEn,
				nicknames_jp: editData.nicknamesJp,
				wiki_en: editData.wikiEn || undefined,
				wiki_ja: editData.wikiJa || undefined,
				gamewith: editData.gamewith || undefined,
				kamigame: editData.kamigame || undefined
			}

			await entityAdapter.updateCharacter(character.id, payload)

			// Invalidate TanStack Query cache
			await queryClient.invalidateQueries({
				queryKey: ['character', character.granblueId],
				refetchType: 'all'
			})

			goto(`/database/characters/${character.granblueId}/style`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	// Helper function for character grid image
	function getCharacterGridImage(character: any): string {
		return getCharacterImage(character?.granblueId, 'grid', '01_style')
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_edit({ name: character?.name?.en ?? 'Character' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Edit Character">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={`/database/characters/${character?.granblueId}/style`}>Back</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="element-ghost" element={elementName} size="small" onclick={saveChanges} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if character}
		<DetailScaffold
			type="character"
			item={character}
			image={getCharacterGridImage(character)}
			{editMode}
		>
			<section class="details">
				<CharacterMetadataSection {character} {editMode} bind:editData />
				<CharacterUncapSection {character} {editMode} bind:editData />
				<CharacterTaxonomySection {character} {editMode} bind:editData />
				<CharacterStatsSection {character} {editMode} bind:editData />

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
				</DetailsContainer>

				<DetailsContainer title="Links">
					<DetailItem
						label="Wiki (EN)"
						bind:value={editData.wikiEn}
						editable={true}
						type="text"
						placeholder="Page name (e.g., Narmaya)"
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
						linkUrl={buildWikiJaUrl(editData.wikiJa, 'character')}
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
						placeholder="Slug (e.g., SSR闇フロレンス)"
						width="480px"
						hasLinkButton={true}
						linkUrl={buildKamigameUrl(editData.kamigame, 'character')}
					/>
				</DetailsContainer>
			</section>
		</DetailScaffold>
	{:else}
		<NotFoundPlaceholder
			title="Character Not Found"
			message="The character you're looking for could not be found."
			backHref="/database/characters"
			backLabel="Back to Characters"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}
</style>
