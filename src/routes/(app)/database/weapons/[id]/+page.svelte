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
	import WeaponMetadataSection from '$lib/features/database/weapons/sections/WeaponMetadataSection.svelte'
	import WeaponUncapSection from '$lib/features/database/weapons/sections/WeaponUncapSection.svelte'
	import WeaponTaxonomySection from '$lib/features/database/weapons/sections/WeaponTaxonomySection.svelte'
	import WeaponStatsSection from '$lib/features/database/weapons/sections/WeaponStatsSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
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
		...entityQueries.weapon(data.weapon?.id ?? ''),
		...withInitialData(data.weapon)
	}))

	// Get weapon from query
	const weapon = $derived(weaponQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(weapon?.id ? `/database/weapons/${weapon.id}/edit` : undefined)

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

	// Generate image items for weapon (base, grid, main, square variants)
	const weaponImages = $derived.by((): ImageItem[] => {
		if (!weapon?.granblueId) return []

		const variants = ['base', 'grid', 'main', 'square'] as const
		const images: ImageItem[] = []

		for (const variant of variants) {
			images.push({
				url: getWeaponImageUrl(weapon.granblueId, variant),
				label: variant,
				variant
			})
		}

		return images
	})
</script>

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
		>
			{#if currentTab === 'info'}
				<section class="details">
					<WeaponMetadataSection {weapon} />
					<WeaponUncapSection {weapon} />
					<WeaponTaxonomySection {weapon} />
					<WeaponStatsSection {weapon} />

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
				<EntityImagesTab images={weaponImages} />
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
</style>
