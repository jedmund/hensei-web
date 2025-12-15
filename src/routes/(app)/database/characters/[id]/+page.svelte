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
	import { fetchWikiPage } from '$lib/api/wiki'

	// Components
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
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

	// Available image sizes for characters
	const characterSizes = ['detail', 'grid', 'main', 'square']

	// Generate image items for character (variants and poses based on uncap level)
	const characterImages = $derived.by((): ImageItem[] => {
		if (!character?.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		// Only include poses that are available - _01 = Base, _02 = MLB (3*), _03 = FLB (5*), _04 = Transcendence
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

		for (const pose of poses) {
			for (const variant of variants) {
				images.push({
					url: getCharacterImage(character.granblueId, variant, pose.id),
					label: `${variant} (${pose.label})`,
					variant,
					pose: pose.id,
					poseLabel: pose.label
				})
			}
		}

		return images
	})

	// Image download handlers
	async function handleDownloadImage(size: string, transformation: string | undefined, force: boolean) {
		if (!character?.id) return
		await entityAdapter.downloadCharacterImage(character.id, size, transformation, force)
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!character?.id) return
		// Download all sizes for this pose
		for (const size of characterSizes) {
			await entityAdapter.downloadCharacterImage(character.id, size, pose, force)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!character?.id) return
		await entityAdapter.downloadCharacterImages(character.id, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!character?.id) return
		// Download this size for all available poses
		const poses = ['01', '02']
		if (character.uncap?.flb) poses.push('03')
		if (character.uncap?.transcendence) poses.push('04')

		for (const pose of poses) {
			await entityAdapter.downloadCharacterImage(character.id, size, pose, false)
		}
	}
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
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={characterSizes}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<CharacterMetadataSection {character} />

					{#if character.nicknames?.en?.length || character.nicknames?.ja?.length}
						<DetailsContainer title="Nicknames">
							{#if character.nicknames?.en?.length}
								<DetailItem label="English">
									<div class="nickname-tags">
										{#each character.nicknames.en as nickname}
											<span class="nickname-tag">{nickname}</span>
										{/each}
									</div>
								</DetailItem>
							{/if}
							{#if character.nicknames?.ja?.length}
								<DetailItem label="Japanese">
									<div class="nickname-tags">
										{#each character.nicknames.ja as nickname}
											<span class="nickname-tag">{nickname}</span>
										{/each}
									</div>
								</DetailItem>
							{/if}
						</DetailsContainer>
					{/if}

					<CharacterUncapSection {character} />
					<CharacterTaxonomySection {character} />
					<CharacterStatsSection {character} />

					{#if character.releaseDate || character.flbDate || character.ulbDate}
						<DetailsContainer title="Dates">
							{#if character.releaseDate}
								<DetailItem label="Release Date" value={character.releaseDate} />
							{/if}
							{#if character.flbDate}
								<DetailItem label="FLB Date" value={character.flbDate} />
							{/if}
							{#if character.ulbDate}
								<DetailItem label="ULB Date" value={character.ulbDate} />
							{/if}
						</DetailsContainer>
					{/if}

					{#if character.links?.wikiEn || character.links?.wikiJa || character.links?.gamewith || character.links?.kamigame}
						<DetailsContainer title="Links">
							{#if character.links?.wikiEn}
								<DetailItem label="Wiki (EN)">
									<a href={character.links.wikiEn} target="_blank" rel="noopener noreferrer" class="external-link">
										{character.links.wikiEn}
									</a>
								</DetailItem>
							{/if}
							{#if character.links?.wikiJa}
								<DetailItem label="Wiki (JP)">
									<a href={character.links.wikiJa} target="_blank" rel="noopener noreferrer" class="external-link">
										{character.links.wikiJa}
									</a>
								</DetailItem>
							{/if}
							{#if character.links?.gamewith}
								<DetailItem label="Gamewith">
									<a href={character.links.gamewith} target="_blank" rel="noopener noreferrer" class="external-link">
										{character.links.gamewith}
									</a>
								</DetailItem>
							{/if}
							{#if character.links?.kamigame}
								<DetailItem label="Kamigame">
									<a href={character.links.kamigame} target="_blank" rel="noopener noreferrer" class="external-link">
										{character.links.kamigame}
									</a>
								</DetailItem>
							{/if}
						</DetailsContainer>
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
				<EntityImagesTab
					images={characterImages}
					{canEdit}
					onDownloadImage={canEdit ? handleDownloadImage : undefined}
					onDownloadAllPose={canEdit ? handleDownloadAllPose : undefined}
				/>
			{:else if currentTab === 'raw'}
				<EntityRawDataTab
					wikiRaw={rawDataQuery.data?.wikiRaw}
					gameRawEn={rawDataQuery.data?.gameRawEn}
					gameRawJp={rawDataQuery.data?.gameRawJp}
					isLoading={rawDataQuery.isLoading}
					{canEdit}
					onFetchWiki={canEdit && character?.id && character?.wiki?.en
						? async () => {
								// Fetch wiki data client-side (bypasses CloudFlare)
								const wikiResult = await fetchWikiPage(character.wiki!.en!)
								if (wikiResult.error) {
									throw new Error(wikiResult.error)
								}
								// Update the character with the wiki_raw data
								await entityAdapter.updateCharacter(character.id, { wiki_raw: wikiResult.wikiRaw })
								rawDataQuery.refetch()
								return { wikiRaw: wikiResult.wikiRaw ?? null, gameRawEn: null, gameRawJp: null }
							}
						: undefined}
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

	.nickname-tags {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
	}

	.nickname-tag {
		background: colors.$grey-90;
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
	}

	.external-link {
		color: colors.$blue;
		text-decoration: none;
		word-break: break-all;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
