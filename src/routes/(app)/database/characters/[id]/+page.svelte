<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import CharacterImagesSection from '$lib/features/database/characters/sections/CharacterImagesSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import { getCharacterImage } from '$lib/utils/images'

	// Types
	import type { PageData } from './$types'
	import type { ImageItem } from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'

	let { data }: { data: PageData } = $props()

	// Tab state from URL
	const currentTab = $derived(($page.url.searchParams.get('tab') as DetailTab) || 'info')

	function handleTabChange(tab: DetailTab) {
		const url = new URL($page.url)
		if (tab === 'info') {
			url.searchParams.delete('tab')
		} else {
			url.searchParams.set('tab', tab)
		}
		goto(url.toString(), { replaceState: true })
	}

	// Use TanStack Query with SSR initial data
	const characterQuery = createQuery(() => ({
		...entityQueries.character(data.character?.id ?? ''),
		...withInitialData(data.character)
	}))

	// Get character from query
	const character = $derived(characterQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(character?.id ? `/database/characters/${character.id}/edit` : undefined)

	// Query for related characters (same character_id)
	const relatedQuery = createQuery(() => ({
		queryKey: ['characters', 'related', character?.id],
		queryFn: async () => {
			if (!character?.id) return []
			return entityAdapter.getRelatedCharacters(character.id)
		},
		enabled: !!character?.characterId
	}))

	// Query for raw data (only when on raw tab)
	const rawDataQuery = createQuery(() => ({
		queryKey: ['characters', 'raw', character?.id],
		queryFn: async () => {
			if (!character?.id) return null
			return entityAdapter.getCharacterRawData(character.id)
		},
		enabled: currentTab === 'raw' && !!character?.id
	}))

	// Helper function for character grid image
	function getCharacterGridImage(character: any): string {
		return getCharacterImage(character?.granblueId, 'grid', '01')
	}

	// Generate image items for character (variants and poses based on uncap level)
	const characterImages = $derived.by((): ImageItem[] => {
		if (!character?.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		// Determine available poses based on uncap level
		// _01 = Base, _02 = MLB (3*), _03 = FLB (5*), _04 = Transcendence
		const poses: { id: string; label: string }[] = [
			{ id: '01', label: 'Base' },
			{ id: '02', label: 'MLB' }
		]

		if (character.uncap?.flb) {
			poses.push({ id: '03', label: 'FLB' })
		}

		if (character.uncap?.transcendence) {
			poses.push({ id: '04', label: 'Transcendence' })
		}

		for (const variant of variants) {
			for (const pose of poses) {
				images.push({
					url: getCharacterImage(character.granblueId, variant, pose.id),
					label: `${variant} (${pose.label})`,
					variant,
					pose: pose.id
				})
			}
		}

		return images
	})
</script>

<div class="page">
	{#if character}
		<DetailScaffold
			type="character"
			item={character}
			image={getCharacterGridImage(character)}
			showEdit={canEdit}
			editUrl={canEdit ? editUrl : undefined}
			{currentTab}
			onTabChange={handleTabChange}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<CharacterMetadataSection {character} />
					<CharacterUncapSection {character} />
					<CharacterTaxonomySection {character} />
					<CharacterStatsSection {character} />

					{#if character?.id && character?.granblueId}
						<CharacterImagesSection
							characterId={character.id}
							granblueId={character.granblueId}
							{canEdit}
						/>
					{/if}

					{#if relatedQuery.data?.length}
						<DetailsContainer title="Related Units">
							<div class="related-units">
								{#each relatedQuery.data as related}
									<a href="/database/characters/{related.id}" class="related-unit">
										<img
											src={getCharacterImage(related.granblueId, 'grid', '01')}
											alt={related.name.en}
											class="related-image"
										/>
										<span class="related-name">{related.name.en}</span>
									</a>
								{/each}
							</div>
						</DetailsContainer>
					{/if}
				</section>
			{:else if currentTab === 'images'}
				<EntityImagesTab images={characterImages} />
			{:else if currentTab === 'raw'}
				<EntityRawDataTab
					wikiRaw={rawDataQuery.data?.wikiRaw}
					gameRawEn={rawDataQuery.data?.gameRawEn}
					gameRawJp={rawDataQuery.data?.gameRawJp}
					isLoading={rawDataQuery.isLoading}
				/>
			{/if}
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

	.related-units {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x 0;
	}

	.related-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-decoration: none;
		color: colors.$grey-30;

		&:hover .related-image {
			transform: scale(1.05);
		}
	}

	.related-image {
		width: 128px;
		height: auto;
		border-radius: layout.$item-corner;
		transition: transform 0.2s ease;
	}

	.related-name {
		margin-top: spacing.$unit;
		font-size: typography.$font-small;
		text-align: center;
	}
</style>
