
<script lang="ts">
	import { goto } from '$app/navigation'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { bulletQueries, bulletKeys } from '$lib/api/queries/bullet.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	const bulletQuery = createQuery(() => ({
		...bulletQueries.byId(data.bullet?.granblueId ?? data.bullet?.id ?? ''),
		...withInitialData(data.bullet)
	}))

	const bullet = $derived(bulletQuery.data)

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	const bulletTypeOptions = Object.entries(BULLET_TYPES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	let editData = $state({
		nameEn: '',
		nameJp: '',
		effectEn: '',
		effectJp: '',
		granblueId: '',
		slug: '',
		bulletType: 1,
		atk: 0,
		hitsAll: false,
		order: 0
	})

	$effect(() => {
		if (bullet) {
			editData = {
				nameEn: bullet.name?.en || '',
				nameJp: bullet.name?.ja || '',
				effectEn: bullet.effect?.en || '',
				effectJp: bullet.effect?.ja || '',
				granblueId: bullet.granblueId || '',
				slug: bullet.slug || '',
				bulletType: bullet.bulletType || 1,
				atk: bullet.atk || 0,
				hitsAll: bullet.hitsAll || false,
				order: bullet.order || 0
			}
		}
	})

	async function saveChanges() {
		if (!bullet?.id) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp || undefined,
				effect_en: editData.effectEn || undefined,
				effect_jp: editData.effectJp || undefined,
				granblue_id: editData.granblueId || undefined,
				slug: editData.slug,
				bullet_type: editData.bulletType,
				atk: editData.atk,
				hits_all: editData.hitsAll,
				order: editData.order
			}

			await entityAdapter.updateBullet(bullet.granblueId || bullet.id, payload)

			await queryClient.invalidateQueries({ queryKey: bulletKeys.all })

			saveSuccess = true

			setTimeout(() => {
				goto(`/database/bullets/${editData.granblueId || bullet.id}`)
			}, 500)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/bullets/${bullet?.granblueId || bullet?.id}`)
	}

	const pageTitle = $derived(
		m.page_title_db_edit({ name: bullet?.name?.en ?? 'Bullet' })
	)
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if bullet}
		<DatabaseFormHeader
			title="Edit Bullet"
			onCancel={handleCancel}
			onSave={saveChanges}
			{isSaving}
		/>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-banner">Changes saved successfully!</div>
		{/if}

		<section class="details">
			<DetailsContainer title="Basic Info">
				<DetailItem
					label="Name (EN)"
					bind:value={editData.nameEn}
					editable={true}
					type="text"
					placeholder="English name"
				/>
				<DetailItem
					label="Name (JP)"
					bind:value={editData.nameJp}
					editable={true}
					type="text"
					placeholder="日本語名"
				/>
				<DetailItem
					label="Granblue ID"
					bind:value={editData.granblueId}
					editable={true}
					type="text"
					placeholder="Granblue ID"
				/>
				<DetailItem
					label="Slug"
					bind:value={editData.slug}
					editable={true}
					type="text"
					placeholder="e.g., iron-bullet"
				/>
			</DetailsContainer>

			<DetailsContainer title="Properties">
				<DetailItem
					label="Bullet Type"
					bind:value={editData.bulletType}
					editable={true}
					type="select"
					options={bulletTypeOptions}
				/>
				<DetailItem
					label="ATK"
					bind:value={editData.atk}
					editable={true}
					type="number"
				/>
				<DetailItem
					label="Hits All"
					bind:value={editData.hitsAll}
					editable={true}
					type="checkbox"
				/>
				<DetailItem
					label="Order"
					bind:value={editData.order}
					editable={true}
					type="number"
				/>
			</DetailsContainer>

			<DetailsContainer title="Effect">
				<DetailItem
					label="Effect (EN)"
					bind:value={editData.effectEn}
					editable={true}
					type="text"
					placeholder="Effect description"
				/>
				<DetailItem
					label="Effect (JP)"
					bind:value={editData.effectJp}
					editable={true}
					type="text"
					placeholder="効果の説明"
				/>
			</DetailsContainer>
		</section>
	{:else if bulletQuery.isLoading}
		<div class="loading">Loading bullet...</div>
	{:else}
		<div class="error">Failed to load bullet</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}

	.success-banner {
		@include database.success-banner;
	}

	.loading,
	.error {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: var(--red);
	}
</style>
