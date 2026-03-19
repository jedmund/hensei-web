
<script lang="ts">
	import { goto } from '$app/navigation'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { bulletKeys } from '$lib/api/queries/bullet.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	const queryClient = useQueryClient()

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

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

	const bulletTypeOptions = Object.entries(BULLET_TYPES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	const canCreate = $derived(
		editData.nameEn.trim() !== '' && editData.slug.trim() !== ''
	)

	async function handleCreate() {
		if (!canCreate) return

		isSaving = true
		saveError = null

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

			const bullet = await entityAdapter.createBullet(payload)

			await queryClient.invalidateQueries({ queryKey: bulletKeys.all })

			goto(`/database/bullets/${bullet.granblueId || bullet.id}`)
		} catch (error) {
			saveError = 'Failed to create bullet. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/bullets')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Bullet' })} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title="New Bullet"
		onCancel={handleCancel}
		onSave={handleCreate}
		{isSaving}
		disabled={!canCreate}
		saveLabel="Create"
		savingLabel="Creating..."
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
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
				placeholder="e.g., 1234567"
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
</div>

<style lang="scss">
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
</style>
