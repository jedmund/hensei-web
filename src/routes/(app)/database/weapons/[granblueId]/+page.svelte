<svelte:options runes={true} />

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
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import WeaponMetadataSection from '$lib/features/database/weapons/sections/WeaponMetadataSection.svelte'
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import WeaponGachaSection from '$lib/features/database/weapons/sections/WeaponGachaSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getWeaponGridImage, getWeaponImage as getWeaponImageUrl } from '$lib/utils/images'

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

	// Edit URL for navigation
	const editUrl = $derived(weapon?.granblueId ? `/database/weapons/${weapon.granblueId}/edit` : undefined)

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
	const weaponImages = $derived.by((): ImageItem[] => {
		if (!weapon?.granblueId) return []

		const variants = ['base', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

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

		return images
	})

	// Image download handlers
	async function handleDownloadImage(size: string, transformation: string | undefined, force: boolean) {
		if (!weapon?.id) return
		// For weapons, '01' means base (no transformation suffix)
		const trans = transformation === '01' ? undefined : transformation
		await entityAdapter.downloadWeaponImage(weapon.id, size, trans, force)
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!weapon?.id) return
		const trans = pose === '01' ? undefined : pose
		// Download all sizes for this pose
		for (const size of weaponSizes) {
			await entityAdapter.downloadWeaponImage(weapon.id, size, trans, force)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!weapon?.id) return
		await entityAdapter.downloadWeaponImages(weapon.id, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!weapon?.id) return
		// Download this size for all available transformations
		const transformations: (string | undefined)[] = [undefined]
		if (weapon.uncap?.transcendence) {
			transformations.push('02', '03')
		}

		for (const trans of transformations) {
			await entityAdapter.downloadWeaponImage(weapon.id, size, trans, false)
		}
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: weapon?.name?.en ?? 'Weapon' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if weapon}
		<DetailScaffold
			type="weapon"
			item={weapon}
			image={getWeaponImage(weapon)}
			showEdit={canEdit}
			editUrl={canEdit ? editUrl : undefined}
			{currentTab}
			onTabChange={handleTabChange}
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={weaponSizes}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<WeaponMetadataSection {weapon} />

					{#if weapon.nicknames?.en?.length || weapon.nicknames?.ja?.length}
						<DetailsContainer title="Nicknames">
							{#if weapon.nicknames?.en?.length}
								<DetailItem label="English">
									<div class="nickname-tags">
										{#each weapon.nicknames.en as nickname}
											<span class="nickname-tag">{nickname}</span>
										{/each}
									</div>
								</DetailItem>
							{/if}
							{#if weapon.nicknames?.ja?.length}
								<DetailItem label="Japanese">
									<div class="nickname-tags">
										{#each weapon.nicknames.ja as nickname}
											<span class="nickname-tag">{nickname}</span>
										{/each}
									</div>
								</DetailItem>
							{/if}
						</DetailsContainer>
					{/if}

					<WeaponUncapSection {weapon} />
					<WeaponTaxonomySection {weapon} />
					<WeaponStatsSection {weapon} />
					<WeaponGachaSection {weapon} />

					{#if weapon.releaseDate || weapon.flbDate || weapon.ulbDate || weapon.transcendenceDate}
						<DetailsContainer title="Dates">
							{#if weapon.releaseDate}
								<DetailItem label="Release Date" value={weapon.releaseDate} />
							{/if}
							{#if weapon.flbDate}
								<DetailItem label="FLB Date" value={weapon.flbDate} />
							{/if}
							{#if weapon.ulbDate}
								<DetailItem label="ULB Date" value={weapon.ulbDate} />
							{/if}
							{#if weapon.transcendenceDate}
								<DetailItem label="Transcendence Date" value={weapon.transcendenceDate} />
							{/if}
						</DetailsContainer>
					{/if}

					<DetailsContainer title="Links">
						<DetailItem label="Wiki (EN)">
							{#if weapon.wiki?.en}
								<a href={weapon.wiki.en} target="_blank" rel="noopener noreferrer" class="external-link">
									{weapon.wiki.en}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Wiki (JP)">
							{#if weapon.wiki?.ja}
								<a href={weapon.wiki.ja} target="_blank" rel="noopener noreferrer" class="external-link">
									{weapon.wiki.ja}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Gamewith">
							{#if weapon.gamewith}
								<a href={weapon.gamewith} target="_blank" rel="noopener noreferrer" class="external-link">
									{weapon.gamewith}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Kamigame">
							{#if weapon.kamigame}
								<a href={weapon.kamigame} target="_blank" rel="noopener noreferrer" class="external-link">
									{weapon.kamigame}
								</a>
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

	.weapon-skills {
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

		.skills-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: spacing.$unit;

			.skill-item {
				padding: spacing.$unit;
				background: #f8f9fa;
				border-radius: 4px;

				.skill-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: #333;
				}

				.skill-description {
					font-size: typography.$font-small;
					color: #666;
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-skills {
				grid-column: 1 / -1;
				text-align: center;
				color: #666;
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
