
<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
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
		player_count: 18,
		group_id: '',
		enemy_id: undefined as number | undefined,
		summon_id: undefined as number | undefined,
		quest_id: undefined as number | undefined,
		extra: false
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
				player_count: raid.playerCount ?? 18,
				group_id: raid.group?.id || '',
				enemy_id: raid.enemyId,
				summon_id: raid.summonId,
				quest_id: raid.questId,
				extra: raid.extra ?? false
			}
		}
	})

	// Player count options
	const playerCountOptions = [
		{ value: 1, label: 'Solo' },
		{ value: 6, label: '6 players' },
		{ value: 18, label: '18 players' },
		{ value: 30, label: '30 players' }
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
				player_count: editData.player_count,
				group_id: editData.group_id,
				enemy_id: toNumberOrUndefined(editData.enemy_id),
				summon_id: toNumberOrUndefined(editData.summon_id),
				quest_id: toNumberOrUndefined(editData.quest_id),
				extra: editData.extra
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
		<DatabaseFormHeader title="Edit Raid" onCancel={handleCancel} onSave={handleSave} {isSaving} disabled={!canSave} />

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
					editable={true}
				>
					<ElementPicker
						bind:value={editData.element}
						includeAny
						mode="dropdown"
						contained
					/>
				</DetailItem>
				<DetailItem
					label="Players"
					bind:value={editData.player_count}
					editable={true}
					type="select"
					options={playerCountOptions}
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
				<DetailItem
					label="Extra"
					sublabel="Raid appears in Extra section"
					bind:value={editData.extra}
					editable={true}
					type="checkbox"
				/>
			</DetailsContainer>
		</section>
	{:else}
		<NotFoundPlaceholder title="Raid Not Found" backHref="/database/raids" backLabel="Back to Raids" />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state {
		@include database.loading-state;
	}

	.error-banner {
		@include database.error-banner;
	}

	.details {
		@include database.details;
	}
</style>
