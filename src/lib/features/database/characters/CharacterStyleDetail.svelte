<script lang="ts">
	// Style-swap character detail body, shared by the full page and the database record panel.

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { characterAdapter } from '$lib/api/adapters/character.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold, {
		type DetailTab
	} from '$lib/features/database/detail/DetailScaffold.svelte'
	import CharacterMetadataSection from '$lib/features/database/characters/sections/CharacterMetadataSection.svelte'
	import CharacterUncapSection from '$lib/features/database/characters/sections/CharacterUncapSection.svelte'
	import CharacterTaxonomySection from '$lib/features/database/characters/sections/CharacterTaxonomySection.svelte'
	import CharacterStatsSection from '$lib/features/database/characters/sections/CharacterStatsSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import { resolveDetailTab } from '$lib/features/database/detail/detailTab'
	import CharacterRefreshActions from '$lib/features/database/characters/refresh/CharacterRefreshActions.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { getElementLabel } from '$lib/utils/element'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import Button from '$lib/components/ui/Button.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'

	// Types
	import type { Character } from '$lib/api/adapters/character.adapter'
	import type { ImageItem } from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'

	interface Props {
		granblueId: string
		/** Server-loaded record (full page); the panel loads it through the query */
		initialData?: Character | null | undefined
		role: number
		/** Requested tab (`?tab=` on the full page, local state in the panel) */
		tab: string | null
		onTabChange: (tab: DetailTab) => void
	}

	let { granblueId, initialData, role, tab, onTabChange }: Props = $props()

	// The :full character carries when its wikitext was fetched (not on the shared Character type)
	type CharacterFetchTimes = {
		wikiRawFetchedAt?: string | null
		wikiRawJpFetchedAt?: string | null
	}

	// Use TanStack Query with SSR initial data — style swap variant
	const characterQuery = createQuery(() => ({
		...entityQueries.character(granblueId, { styleSwap: true }),
		...(initialData ? withInitialData(initialData) : {})
	}))

	// Get character from query
	const character = $derived(characterQuery.data)
	const userRole = $derived(role || 0)
	const canEdit = $derived(userRole >= 7)

	// Tab state from URL; raw data is editor-only, so non-editors fall back to Info
	const currentTab = $derived(resolveDetailTab(tab, canEdit))

	// Element for button styling
	const elementName = $derived(
		getElementLabel(character?.element)?.toLowerCase() as
			'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Query for related characters (same character_id)
	const relatedQuery = createQuery(() => ({
		queryKey: ['characters', 'related', character?.id],
		queryFn: async () => {
			if (!character?.id) return []
			return characterAdapter.getRelatedCharacters(character.id)
		},
		enabled: !!character?.characterId
	}))

	// Query for raw data (only when on raw tab)
	const rawDataQuery = createQuery(() => ({
		queryKey: ['characters', 'raw', character?.id],
		queryFn: async () => {
			if (!character?.id) return null
			return characterAdapter.getCharacterRawData(character.id)
		},
		enabled: currentTab === 'raw' && !!character?.id
	}))

	// Helper function for character grid image
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data from API
	function getCharacterGridImage(character: any): string {
		return getCharacterImage(character?.granblueId, 'grid', '01_style')
	}

	// Available image sizes for characters
	const characterSizes = ['detail', 'grid', 'main', 'square']

	// Generate image items — style swap characters only have _01_style pose
	const characterImages = $derived.by((): ImageItem[] => {
		if (!character?.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		for (const variant of variants) {
			images.push({
				url: getCharacterImage(character.granblueId, variant, '01_style'),
				label: `${variant} (Style)`,
				variant,
				pose: '01_style',
				poseLabel: 'Style'
			})
		}
		return images
	})

	// Image download handlers
	async function handleDownloadImage(
		size: string,
		transformation: string | undefined,
		force: boolean
	) {
		if (!character?.id) return
		await characterAdapter.downloadCharacterImage(character.id, size, transformation, force)
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!character?.id) return
		for (const size of characterSizes) {
			await characterAdapter.downloadCharacterImage(character.id, size, pose, force)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!character?.id) return
		await characterAdapter.downloadCharacterImages(character.id, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!character?.id) return
		const poses = ['style']
		for (const pose of poses) {
			await characterAdapter.downloadCharacterImage(character.id, size, pose, false)
		}
	}
</script>

{#if character}
	<DetailScaffold
		type="character"
		item={character}
		image={getCharacterGridImage(character)}
		{currentTab}
		{onTabChange}
		showRaw={canEdit}
		onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
		onDownloadSize={canEdit ? handleDownloadSize : undefined}
		availableSizes={characterSizes}
	>
		{#if currentTab === 'info'}
			<section class="details">
				<CharacterMetadataSection {character} />
				<CharacterUncapSection {character} />
				<CharacterTaxonomySection {character} />
				<CharacterStatsSection {character} />

				<DetailsContainer title="Nicknames">
					<DetailItem label="Nicknames (EN)">
						{#if character.nicknames?.en?.length}
							<div class="nickname-tags">
								{#each character.nicknames.en as nickname, i (i)}
									<span class="nickname-tag">{nickname}</span>
								{/each}
							</div>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
					<DetailItem label="Nicknames (JP)">
						{#if character.nicknames?.ja?.length}
							<div class="nickname-tags">
								{#each character.nicknames.ja as nickname, i (i)}
									<span class="nickname-tag">{nickname}</span>
								{/each}
							</div>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
				</DetailsContainer>

				<DetailsContainer title="Dates">
					<DetailItem label="Release Date" value={character.releaseDate || '—'} />
					{#if character.uncap?.flb}
						<DetailItem label="FLB Date" value={character.flbDate || '—'} />
					{/if}
					{#if character.uncap?.transcendence}
						<DetailItem label="Transcendence Date" value={character.transcendenceDate || '—'} />
					{/if}
					{#if character.uncap?.ulb}
						<DetailItem label="ULB Date" value={character.ulbDate || '—'} />
					{/if}
				</DetailsContainer>

				<DetailsContainer title="Links">
					<DetailItem label="Wiki (EN)">
						{#if character.wiki?.en}
							<Button
								href={buildWikiEnUrl(character.wiki.en) ?? undefined}
								target="_blank"
								variant="element-ghost"
								element={elementName}
								size="small"
								rightIcon="link"
							>
								Open
							</Button>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
					<DetailItem label="Wiki (JP)">
						{#if character.wiki?.ja}
							<Button
								href={buildWikiJaUrl(character.wiki.ja, 'character') ?? undefined}
								target="_blank"
								variant="element-ghost"
								element={elementName}
								size="small"
								rightIcon="link"
							>
								Open
							</Button>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
					<DetailItem label="Gamewith">
						{#if character.gamewith}
							<Button
								href={buildGamewithUrl(character.gamewith) ?? undefined}
								target="_blank"
								variant="element-ghost"
								element={elementName}
								size="small"
								rightIcon="link"
							>
								Open
							</Button>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
					<DetailItem label="Kamigame">
						{#if character.kamigame}
							<Button
								href={buildKamigameUrl(character.kamigame, 'character') ?? undefined}
								target="_blank"
								variant="element-ghost"
								element={elementName}
								size="small"
								rightIcon="link"
							>
								Open
							</Button>
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
				</DetailsContainer>

				{#if relatedQuery.data?.length}
					<DetailsContainer title="Related Units">
						<div class="related-units">
							{#each relatedQuery.data as related (related.id)}
								<a
									href={localizeHref(
										`/database/characters/${related.granblueId}${related.styleSwap ? '/style' : ''}`
									)}
									class="related-unit"
								>
									<img
										src={getCharacterImage(
											related.granblueId,
											'grid',
											related.styleSwap ? '01_style' : '01'
										)}
										alt={localizedName(related.name)}
										class="related-image"
									/>
									<span class="related-name">{localizedName(related.name)}</span>
									<CharacterTags character={related} />
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
				fetchedAt={{
					en: (character as CharacterFetchTimes | undefined)?.wikiRawFetchedAt,
					jp: (character as CharacterFetchTimes | undefined)?.wikiRawJpFetchedAt
				}}
			>
				{#snippet wikiActions()}
					{#if canEdit && character?.id}
						<CharacterRefreshActions
							characterId={character.id}
							characterName={character.styleName ?? character.name}
							onRefreshed={() => {
								characterQuery.refetch()
								rawDataQuery.refetch()
							}}
						/>
					{/if}
				{/snippet}
			</EntityRawDataTab>
		{/if}
	</DetailScaffold>
{:else if characterQuery.isPending}
	<div class="loading" aria-busy="true"></div>
{:else}
	<NotFoundPlaceholder
		title="Character Not Found"
		message="The character you're looking for could not be found."
		backHref={localizeHref('/database/characters')}
		backLabel="Back to Characters"
	/>
{/if}

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.loading {
		min-height: 320px;
	}

	.details {
		@include database.details;
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
		gap: spacing.$unit-half;
		text-decoration: none;
		color: var(--text-primary);

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
		background: var(--background);
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
	}

	.empty-value {
		color: var(--text-secondary);
	}
</style>
