
<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { localizedName } from '$lib/utils/locale'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	const seriesQuery = createQuery(() => ({
		...entityQueries.characterSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const pageTitle = $derived(series?.name ? `Edit ${localizedName(series.name)}` : 'Edit Character Series')

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Editable fields
	let editData = $state({
		nameEn: '',
		nameJa: '',
		slug: '',
		order: 0
	})

	// Populate edit data when series loads
	$effect(() => {
		if (series) {
			editData = {
				nameEn: series.name.en || '',
				nameJa: series.name.ja || '',
				slug: series.slug || '',
				order: series.order || 0
			}
		}
	})

	async function saveChanges() {
		if (!series?.id) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJa,
				slug: editData.slug,
				order: editData.order
			}

			await entityAdapter.updateCharacterSeries(series.id, payload)

			// Invalidate cache
			await queryClient.invalidateQueries({
				queryKey: ['characterSeries'],
				refetchType: 'all'
			})

			// Navigate back to detail page (use new slug if changed)
			goto(`/database/series/characters/${editData.slug}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Edit Character Series">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={`/database/series/characters/${series?.slug}`}>Back</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="ghost" size="small" onclick={saveChanges} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if series}
		<div class="content">
			{#if saveError}
				<div class="error-banner">{saveError}</div>
			{/if}

			<DetailsContainer title="Basic Info">
				<DetailItem
					label="Name (EN)"
					bind:value={editData.nameEn}
					editable={true}
					type="text"
					placeholder="English name"
					width="320px"
				/>
				<DetailItem
					label="Name (JA)"
					bind:value={editData.nameJa}
					editable={true}
					type="text"
					placeholder="Japanese name"
					width="320px"
				/>
				<DetailItem
					label="Slug"
					bind:value={editData.slug}
					editable={true}
					type="text"
					placeholder="url-friendly-slug"
					width="240px"
				/>
				<DetailItem
					label="Order"
					bind:value={editData.order}
					editable={true}
					type="number"
					placeholder="0"
				/>
			</DetailsContainer>
		</div>
	{:else}
		<NotFoundPlaceholder
			title="Series Not Found"
			message="The character series you're looking for could not be found."
			backHref="/database/characters?view=series"
			backLabel="Back to Series"
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

	.content {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}
</style>
