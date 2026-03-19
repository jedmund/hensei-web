
<script lang="ts">
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const queryClient = useQueryClient()

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Form fields
	let formData = $state({
		nameEn: '',
		nameJa: '',
		slug: '',
		order: 0
	})

	async function createSeries() {
		if (!formData.nameEn || !formData.slug) {
			saveError = 'Name (EN) and Slug are required.'
			return
		}

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: formData.nameEn,
				name_jp: formData.nameJa,
				slug: formData.slug,
				order: formData.order
			}

			await entityAdapter.createCharacterSeries(payload)

			// Invalidate cache
			await queryClient.invalidateQueries({
				queryKey: ['characterSeries'],
				refetchType: 'all'
			})

			// Navigate to the new series detail page
			goto(`/database/series/characters/${formData.slug}`)
		} catch (error) {
			saveError = 'Failed to create character series. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}
</script>

<PageMeta title="New Character Series" description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="New Character Series">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/characters?view=series">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="ghost" size="small" onclick={createSeries} disabled={isSaving}>
				{isSaving ? 'Creating...' : 'Create'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	<div class="content">
		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		<DetailsContainer title="Basic Info">
			<DetailItem
				label="Name (EN)"
				bind:value={formData.nameEn}
				editable={true}
				type="text"
				placeholder="English name"
				width="320px"
			/>
			<DetailItem
				label="Name (JA)"
				bind:value={formData.nameJa}
				editable={true}
				type="text"
				placeholder="Japanese name"
				width="320px"
			/>
			<DetailItem
				label="Slug"
				bind:value={formData.slug}
				editable={true}
				type="text"
				placeholder="url-friendly-slug"
				width="240px"
			/>
			<DetailItem
				label="Order"
				bind:value={formData.order}
				editable={true}
				type="number"
				placeholder="0"
			/>
		</DetailsContainer>
	</div>
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
