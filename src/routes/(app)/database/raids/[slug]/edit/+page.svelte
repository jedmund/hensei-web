<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
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

	// Get raid slug from URL
	const raidSlug = $derived($page.params.slug)

	// Query for raid data
	const raidQuery = createQuery(() => ({
		queryKey: ['raids', raidSlug],
		queryFn: () => raidAdapter.getBySlug(raidSlug ?? ''),
		enabled: !!raidSlug
	}))

	// Query for raid groups (for dropdown)
	const groupsQuery = createQuery(() => ({
		queryKey: ['raid-groups', 'list'],
		queryFn: () => raidAdapter.getGroups(),
		staleTime: 1000 * 60 * 10
	}))

	const raid = $derived(raidQuery.data)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Edit data state - use undefined for nullable number fields to avoid validation issues
	let editData = $state({
		name_en: '',
		name_jp: '',
		slug: '',
		level: undefined as number | undefined,
		element: 0,
		group_id: '',
		enemy_id: undefined as number | undefined,
		summon_id: undefined as number | undefined,
		quest_id: undefined as number | undefined
	})

	// Sync edit data when raid changes
	$effect(() => {
		if (raid) {
			editData = {
				name_en: raid.name.en || '',
				name_jp: raid.name.ja || '',
				slug: raid.slug || '',
				level: raid.level,
				element: raid.element ?? 0,
				group_id: raid.group?.id || '',
				enemy_id: raid.enemy_id,
				summon_id: raid.summon_id,
				quest_id: raid.quest_id
			}
		}
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

	// Helper to convert empty strings to undefined for number fields
	function toNumberOrUndefined(value: number | string | undefined): number | undefined {
		if (value === '' || value === undefined || value === null) return undefined
		const num = typeof value === 'string' ? parseInt(value, 10) : value
		return isNaN(num) ? undefined : num
	}

	// Save changes
	async function handleSave() {
		if (!canSave || !raid || !raidSlug) return

		isSaving = true
		saveError = null

		try {
			const result = await raidAdapter.update(raidSlug, {
				name_en: editData.name_en,
				name_jp: editData.name_jp,
				slug: editData.slug,
				level: toNumberOrUndefined(editData.level),
				element: editData.element,
				group_id: editData.group_id,
				enemy_id: toNumberOrUndefined(editData.enemy_id),
				summon_id: toNumberOrUndefined(editData.summon_id),
				quest_id: toNumberOrUndefined(editData.quest_id)
			})

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['raids'] })

			// Navigate to the new slug if it changed
			goto(`/database/raids/${result.slug}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to save raid'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto(`/database/raids/${raidSlug}`)
	}
</script>

<div class="page">
	{#if raidQuery.isLoading}
		<div class="loading-state">
			<p>Loading raid...</p>
		</div>
	{:else if raid}
		<SidebarHeader title="Edit Raid">
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

			<DetailsContainer title="IDs">
				<DetailItem
					label="Enemy ID"
					bind:value={editData.enemy_id}
					editable={true}
					type="number"
				/>
				<DetailItem
					label="Summon ID"
					bind:value={editData.summon_id}
					editable={true}
					type="number"
				/>
				<DetailItem
					label="Quest ID"
					bind:value={editData.quest_id}
					editable={true}
					type="number"
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
	{:else}
		<div class="not-found">
			<h2>Raid Not Found</h2>
			<p>The raid you're looking for could not be found.</p>
			<Button variant="secondary" onclick={() => goto('/database/raids')}>
				Back to Raids
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit-4x;

		h2 {
			margin-bottom: spacing.$unit;
		}

		p {
			color: var(--text-secondary);
			margin-bottom: spacing.$unit-2x;
		}
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
