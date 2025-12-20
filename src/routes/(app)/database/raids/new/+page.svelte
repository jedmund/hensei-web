<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import type { PageData } from './$types'

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

	// Query for raid groups (for dropdown)
	const groupsQuery = createQuery(() => ({
		queryKey: ['raid-groups', 'list'],
		queryFn: () => raidAdapter.getGroups(),
		staleTime: 1000 * 60 * 10
	}))

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Edit data state
	let editData = $state({
		name_en: '',
		name_jp: '',
		slug: '',
		level: 0,
		element: 0,
		group_id: ''
	})

	// Element options
	const elementOptions = [
		{ value: 0, label: 'None' },
		{ value: 1, label: 'Fire' },
		{ value: 2, label: 'Water' },
		{ value: 3, label: 'Earth' },
		{ value: 4, label: 'Wind' },
		{ value: 5, label: 'Light' },
		{ value: 6, label: 'Dark' }
	]

	// Group options derived from query
	const groupOptions = $derived(
		(groupsQuery.data ?? []).map((g) => ({
			value: g.id,
			label: displayName(g)
		}))
	)

	// Validation
	const canSave = $derived(
		editData.name_en.trim() !== '' && editData.slug.trim() !== '' && editData.group_id !== ''
	)

	// Create raid
	async function handleSave() {
		if (!canSave) return

		isSaving = true
		saveError = null

		try {
			const newRaid = await raidAdapter.create({
				name_en: editData.name_en,
				name_jp: editData.name_jp,
				slug: editData.slug,
				level: editData.level,
				element: editData.element,
				group_id: editData.group_id
			})

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['raids'] })

			// Navigate to the new raid's detail page
			goto(`/database/raids/${newRaid.slug}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to create raid'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto('/database/raids')
	}
</script>

<div class="page">
	<SidebarHeader title="New Raid">
		{#snippet leftAccessory()}
			<Button variant="secondary" size="small" onclick={handleCancel}>Cancel</Button>
		{/snippet}
		{#snippet rightAccessory()}
			<Button variant="primary" size="small" onclick={handleSave} disabled={!canSave || isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</SidebarHeader>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title="Raid Details">
			<DetailItem
				label="Name (EN)"
				bind:value={editData.name_en}
				editable={true}
				type="text"
				placeholder="English name"
			/>
			<DetailItem
				label="Name (JA)"
				bind:value={editData.name_jp}
				editable={true}
				type="text"
				placeholder="Japanese name"
			/>
			<DetailItem
				label="Slug"
				bind:value={editData.slug}
				editable={true}
				type="text"
				placeholder="url-friendly-slug"
			/>
			<DetailItem
				label="Level"
				bind:value={editData.level}
				editable={true}
				type="number"
			/>
			<DetailItem
				label="Element"
				bind:value={editData.element}
				editable={true}
				type="select"
				options={elementOptions}
			/>
		</DetailsContainer>

		<DetailsContainer title="Classification">
			<DetailItem
				label="Raid Group"
				bind:value={editData.group_id}
				editable={true}
				type="select"
				options={groupOptions}
			/>
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: white;
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.error-banner {
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: colors.$error--bg--light;
	}

	.details {
		display: flex;
		flex-direction: column;
	}
</style>
