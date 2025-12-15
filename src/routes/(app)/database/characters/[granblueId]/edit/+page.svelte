<svelte:options runes={true} />

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
	import CharacterGachaSection from '$lib/features/database/characters/sections/CharacterGachaSection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getCharacterImage } from '$lib/utils/images'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const characterQuery = createQuery(() => ({
		...entityQueries.character(data.character?.granblueId ?? ''),
		...withInitialData(data.character)
	}))

	// Get character from query
	const character = $derived(characterQuery.data)

	// Always in edit mode
	const editMode = true

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Editable fields - initialized from character data
	let editData = $state({
		name: '',
		granblueId: '',
		characterId: null as number | null,
		rarity: 1,
		element: 0,
		race1: null as number | null,
		race2: null as number | null,
		gender: 0,
		proficiency1: 0,
		proficiency2: 0,
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		flb: false,
		ulb: false,
		transcendence: false,
		special: false,
		releaseDate: '',
		flbDate: '',
		ulbDate: ''
	})

	// Populate edit data when character loads
	$effect(() => {
		if (character) {
			editData = {
				name: character.name?.en || '',
				granblueId: character.granblueId || '',
				characterId: character.characterId ?? null,
				rarity: character.rarity || 1,
				element: character.element || 0,
				race1: character.race?.[0] ?? null,
				race2: character.race?.[1] ?? null,
				gender: character.gender || 0,
				proficiency1: character.proficiency?.[0] || 0,
				proficiency2: character.proficiency?.[1] || 0,
				minHp: character.hp?.minHp || 0,
				maxHp: character.hp?.maxHp || 0,
				maxHpFlb: character.hp?.maxHpFlb || 0,
				minAtk: character.atk?.minAtk || 0,
				maxAtk: character.atk?.maxAtk || 0,
				maxAtkFlb: character.atk?.maxAtkFlb || 0,
				flb: character.uncap?.flb || false,
				ulb: character.uncap?.ulb || false,
				transcendence: character.uncap?.transcendence || false,
				special: character.special || false,
				releaseDate: character.releaseDate || '',
				flbDate: character.flbDate || '',
				ulbDate: character.ulbDate || ''
			}
		}
	})

	async function saveChanges() {
		if (!character?.id) return

		isSaving = true
		saveError = null

		try {
			// Prepare the data for API (flat snake_case format)
			const payload = {
				name_en: editData.name,
				granblue_id: editData.granblueId,
				character_id: editData.characterId ? [editData.characterId] : [],
				rarity: editData.rarity,
				element: editData.element,
				race1: editData.race1,
				race2: editData.race2,
				gender: editData.gender,
				proficiency1: editData.proficiency1,
				proficiency2: editData.proficiency2,
				min_hp: editData.minHp,
				max_hp: editData.maxHp,
				max_hp_flb: editData.maxHpFlb,
				min_atk: editData.minAtk,
				max_atk: editData.maxAtk,
				max_atk_flb: editData.maxAtkFlb,
				flb: editData.flb,
				ulb: editData.ulb,
				special: editData.special,
				release_date: editData.releaseDate || null,
				flb_date: editData.flbDate || null,
				ulb_date: editData.ulbDate || null
			}

			await entityAdapter.updateCharacter(character.id, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: ['character', character.granblueId] })

			// Navigate back to detail page
			goto(`/database/characters/${character.granblueId}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/characters/${character?.granblueId}`)
	}

	// Helper function for character grid image
	function getCharacterGridImage(character: any): string {
		return getCharacterImage(character?.granblueId, 'grid', '01')
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_edit({ name: character?.name?.en ?? 'Character' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if character}
		<DetailScaffold
			type="character"
			item={character}
			image={getCharacterGridImage(character)}
			showEdit={true}
			{editMode}
			{isSaving}
			{saveError}
			onSave={saveChanges}
			onCancel={handleCancel}
		>
			<section class="details">
				<CharacterMetadataSection {character} {editMode} bind:editData />
				<CharacterUncapSection {character} {editMode} bind:editData />
				<CharacterTaxonomySection {character} {editMode} bind:editData />
				<CharacterGachaSection {character} {editMode} bind:editData />
				<CharacterStatsSection {character} {editMode} bind:editData />

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
			</section>
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Character Not Found</h2>
			<p>The character you're looking for could not be found.</p>
			<button onclick={() => goto('/database/characters')}>Back to Characters</button>
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
			padding: spacing.$unit * 0.5 spacing.$unit;
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
