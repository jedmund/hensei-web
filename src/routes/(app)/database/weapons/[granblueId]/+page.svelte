
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'
	import { fetchWikiPage } from '$lib/api/wiki'

	// Components
	import DetailScaffold, {
		type DetailTab
	} from '$lib/features/database/detail/DetailScaffold.svelte'
	import WeaponMetadataSection from '$lib/features/database/weapons/sections/WeaponMetadataSection.svelte'
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import WeaponGachaSection from '$lib/features/database/weapons/sections/WeaponGachaSection.svelte'
	import WeaponAwakeningSection from '$lib/features/database/weapons/sections/WeaponAwakeningSection.svelte'
	import WeaponForgeSection from '$lib/features/database/weapons/sections/WeaponForgeSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { toast } from 'svelte-sonner'
	import { getWeaponGridImage, getWeaponImage as getWeaponImageUrl } from '$lib/utils/images'
	import { getElementLabel, ELEMENT_DISPLAY_ORDER } from '$lib/utils/element'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { getListUrl } from '$lib/utils/listNavigation'

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
	const weaponQuery = createQuery(() => ({
		...entityQueries.weapon(data.weapon?.granblueId ?? ''),
		...withInitialData(data.weapon)
	}))

	// Get weapon from query
	const weapon = $derived(weaponQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

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

	// Edit URL for navigation
	const editUrl = $derived(
		weapon?.granblueId ? `/database/weapons/${weapon.granblueId}/edit` : undefined
	)

	// Query for raw data (only when on raw tab)
	const rawDataQuery = createQuery(() => ({
		queryKey: ['weapons', 'raw', weapon?.id],
		queryFn: async () => {
			if (!weapon?.id) return null
			return entityAdapter.getWeaponRawData(weapon.id)
		},
		enabled: currentTab === 'raw' && !!weapon?.id
	}))

	// Helper function for weapon grid image
	function getWeaponImage(weapon: any): string {
		return getWeaponGridImage(weapon?.granblueId, weapon?.element, weapon?.instanceElement)
	}

	// Available image sizes for weapons
	const weaponSizes = ['base', 'grid', 'main', 'square']

	// Generate image items for weapon (base, grid, main, square variants)
	// Weapons have transformations: Base (no suffix), Transcendence Stage 1 (_02), Transcendence Stage 5 (_03)
	// Element-changeable weapons (element === 0) show all elements at all sizes
	const weaponImages = $derived.by((): ImageItem[] => {
		if (!weapon?.granblueId) return []

		const variants = ['base', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		if (weapon.element === 0) {
			// Element-changeable: show all elements at all sizes
			// Element 0 (Null) has no base art, so show a placeholder there
			const elements = [0, ...ELEMENT_DISPLAY_ORDER]
			for (const element of elements) {
				const elementLabel = getElementLabel(element)
				for (const variant of variants) {
					if (element === 0 && variant === 'base') {
						images.push({
							url: '',
							label: `${variant} (${elementLabel})`,
							variant,
							pose: `element-${element}`,
							poseLabel: elementLabel,
							placeholder: true
						})
					} else {
						images.push({
							url: getWeaponImageUrl(weapon.granblueId, variant, element),
							label: `${variant} (${elementLabel})`,
							variant,
							pose: `element-${element}`,
							poseLabel: elementLabel
						})
					}
				}
			}
		} else {
			// Only include transformations that are available
			const transformations: { id: string; label: string; suffix?: string }[] = [
				{ id: '01', label: 'Base', suffix: undefined }
			]

			if (weapon.uncap?.transcendence) {
				transformations.push(
					{ id: '02', label: 'Transcendence (1)', suffix: '02' },
					{ id: '03', label: 'Transcendence (5)', suffix: '03' }
				)
			}

			for (const transformation of transformations) {
				for (const variant of variants) {
					images.push({
						url: getWeaponImageUrl(weapon.granblueId, variant, undefined, transformation.suffix),
						label: `${variant} (${transformation.label})`,
						variant,
						pose: transformation.id,
						poseLabel: transformation.label
					})
				}
			}
		}

		return images
	})

	// Poll the batch download status until it completes or fails
	async function pollDownloadStatus(weaponId: string, toastId: string | number): Promise<void> {
		const maxAttempts = 60
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((r) => setTimeout(r, 2000))
			const status = await entityAdapter.getWeaponDownloadStatus(weaponId)

			if (status.status === 'processing') {
				const downloaded = status.imagesDownloaded ?? 0
				const total = status.imagesTotal ?? 0
				toast.loading(`Downloading images… ${downloaded}/${total}`, { id: toastId })
			}

			if (status.status === 'completed') {
				toast.success(`Downloaded ${status.imagesDownloaded ?? ''} images`, { id: toastId })
				return
			}
			if (status.status === 'failed') {
				toast.error(status.error ?? 'Download failed', { id: toastId })
				return
			}
		}
		toast.error('Download timed out', { id: toastId })
	}

	// Kick off batch download and poll for completion
	async function batchDownload(weaponId: string, options: { force?: boolean; size?: string }) {
		const toastId = toast.loading('Queuing download…')
		try {
			await entityAdapter.downloadWeaponImages(weaponId, options)
			toast.loading('Downloading images…', { id: toastId })
			await pollDownloadStatus(weaponId, toastId)
		} catch (e) {
			toast.error('Failed to start download', { id: toastId })
		}
	}

	// Image download handlers
	async function handleDownloadImage(
		size: string,
		transformation: string | undefined,
		force: boolean
	) {
		if (!weapon?.id) return

		if (weapon.element === 0) {
			await batchDownload(weapon.id, { force, size })
		} else {
			const trans = transformation === '01' ? undefined : transformation
			await entityAdapter.downloadWeaponImage(weapon.id, size, trans, force)
			toast.success('Image downloaded')
		}
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!weapon?.id) return

		if (weapon.element === 0) {
			await batchDownload(weapon.id, { force })
		} else {
			const trans = pose === '01' ? undefined : pose
			for (const size of weaponSizes) {
				await entityAdapter.downloadWeaponImage(weapon.id, size, trans, force)
			}
			toast.success('Images downloaded')
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!weapon?.id) return
		await batchDownload(weapon.id, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!weapon?.id) return

		if (weapon.element === 0) {
			await batchDownload(weapon.id, { force: false, size })
		} else {
			const transformations: (string | undefined)[] = [undefined]
			if (weapon.uncap?.transcendence) {
				transformations.push('02', '03')
			}

			for (const trans of transformations) {
				await entityAdapter.downloadWeaponImage(weapon.id, size, trans, false)
			}
			toast.success('Images downloaded')
		}
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: weapon?.name?.en ?? 'Weapon' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Weapon">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={getListUrl('weapons')}>Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="element-ghost" element={elementName} size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if weapon}
		<DetailScaffold
			type="weapon"
			item={weapon}
			image={getWeaponImage(weapon)}
			{currentTab}
			onTabChange={handleTabChange}
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={weaponSizes}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<WeaponMetadataSection {weapon} />
					<WeaponGachaSection {weapon} />
					<WeaponUncapSection {weapon} />
					<WeaponTaxonomySection {weapon} />
					<WeaponStatsSection {weapon} />
					<WeaponAwakeningSection {weapon} />
					<WeaponForgeSection {weapon} />

					<DetailsContainer title="Nicknames">
						<DetailItem label="English">
							{#if weapon.nicknames?.en?.length}
								<div class="nickname-tags">
									{#each weapon.nicknames.en as nickname}
										<span class="nickname-tag">{nickname}</span>
									{/each}
								</div>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Japanese">
							{#if weapon.nicknames?.ja?.length}
								<div class="nickname-tags">
									{#each weapon.nicknames.ja as nickname}
										<span class="nickname-tag">{nickname}</span>
									{/each}
								</div>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
					</DetailsContainer>

					<DetailsContainer title="Dates">
						<DetailItem label="Release Date" value={weapon.releaseDate || '—'} />
						<DetailItem label="FLB Date" value={weapon.flbDate || '—'} />
						<DetailItem label="ULB Date" value={weapon.ulbDate || '—'} />
						<DetailItem label="Transcendence Date" value={weapon.transcendenceDate || '—'} />
					</DetailsContainer>

					<DetailsContainer title="Links">
						<DetailItem label="Wiki (EN)">
							{#if weapon.wiki?.en}
								<Button
									href={buildWikiEnUrl(weapon.wiki.en) ?? undefined}
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
							{#if weapon.wiki?.ja}
								<Button
									href={buildWikiJaUrl(weapon.wiki.ja, 'weapon') ?? undefined}
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
							{#if weapon.gamewith}
								<Button
									href={buildGamewithUrl(weapon.gamewith) ?? undefined}
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
							{#if weapon.kamigame}
								<Button
									href={buildKamigameUrl(weapon.kamigame, 'weapon', weapon.rarity) ?? undefined}
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

					<div class="weapon-skills">
						<h3>Skills</h3>
						<div class="skills-grid">
							{#if weapon.weapon_skills && weapon.weapon_skills.length > 0}
								{#each weapon.weapon_skills as skill}
									<div class="skill-item">
										<h4 class="skill-name">{skill.name || 'Unknown Skill'}</h4>
										<p class="skill-description">
											{skill.description || 'No description available'}
										</p>
									</div>
								{/each}
							{:else}
								<p class="no-skills">No skills available</p>
							{/if}
						</div>
					</div>
				</section>
			{:else if currentTab === 'images'}
				<EntityImagesTab
					images={weaponImages}
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
					onFetchWiki={canEdit && weapon?.id && weapon?.wiki?.en
						? async () => {
								// Fetch wiki data client-side (bypasses CloudFlare)
								const wikiResult = await fetchWikiPage(weapon.wiki!.en!)
								if (wikiResult.error) {
									throw new Error(wikiResult.error)
								}
								// Update the weapon with the wiki_raw data
								await entityAdapter.updateWeapon(weapon.id, { wiki_raw: wikiResult.wikiRaw })
								rawDataQuery.refetch()
								return { wikiRaw: wikiResult.wikiRaw ?? null, gameRawEn: null, gameRawJp: null }
							}
						: undefined}
				/>
			{/if}
		</DetailScaffold>
	{:else}
		<NotFoundPlaceholder
			title="Weapon Not Found"
			message="The weapon you're looking for could not be found."
			backHref="/database/weapons"
			backLabel="Back to Weapons"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.weapon-skills {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--table-border);

		&:last-child {
			border-bottom: none;
		}

		h3 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.skills-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: spacing.$unit;

			.skill-item {
				padding: spacing.$unit;
				background: var(--table-header-bg);
				border-radius: layout.$item-corner-small;

				.skill-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: var(--text-primary);
				}

				.skill-description {
					font-size: typography.$font-small;
					color: var(--text-secondary);
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-skills {
				grid-column: 1 / -1;
				text-align: center;
				color: var(--text-secondary);
				font-style: italic;
			}
		}
	}

	@media (max-width: 768px) {
		.weapon-skills .skills-grid {
			grid-template-columns: 1fr;
		}
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
