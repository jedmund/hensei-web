
<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { withInitialData } from '$lib/query/ssr'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { getAugmentTypeLabel } from '$lib/utils/augmentType'
	import { localizedName } from '$lib/utils/locale'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const seriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)
	const editUrl = $derived(series?.slug ? `/database/series/weapons/${series.slug}/edit` : undefined)

	const pageTitle = $derived(series?.name ? `${localizedName(series.name)} Series` : 'Weapon Series')
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Weapon Series" backHref="/database/weapons?view=series">
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="ghost" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if series}
		<div class="content">
			<DetailsContainer title="Basic Info">
				<DetailItem label="Name (EN)" value={series.name.en} />
				<DetailItem label="Name (JA)" value={series.name.ja} />
				<DetailItem label="Slug" value={series.slug} />
				<DetailItem label="Order" value={series.order} />
			</DetailsContainer>

			<DetailsContainer title="Flags">
				<DetailItem label="Extra Grid" value={series.extra ? 'Yes' : 'No'} />
				<DetailItem label="Element Changeable" value={series.elementChangeable ? 'Yes' : 'No'} />
				<DetailItem label="Has Weapon Keys" value={series.hasWeaponKeys ? 'Yes' : 'No'} />
				<DetailItem label="Has Awakening" value={series.hasAwakening ? 'Yes' : 'No'} />
				<DetailItem label="Augment Type" value={getAugmentTypeLabel(series.augmentType)} />
			</DetailsContainer>

			{#if series.weaponCount !== undefined}
				<DetailsContainer title="Statistics">
					<DetailItem label="Weapon Count" value={series.weaponCount} />
				</DetailsContainer>
			{/if}
		</div>
	{:else}
		<div class="not-found">
			<h2>Series Not Found</h2>
			<p>The weapon series you're looking for could not be found.</p>
			<button onclick={() => goto('/database/weapons?view=series')}>Back to Series</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		display: flex;
		flex-direction: column;
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: #007bff;
			color: white;
			border: none;
			padding: spacing.$unit-half spacing.$unit;
			border-radius: layout.$item-corner-small;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}
</style>
