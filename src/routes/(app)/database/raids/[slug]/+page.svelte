<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
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

	// Get raid slug from URL
	const raidSlug = $derived($page.params.slug)

	// Query for raid data
	const raidQuery = createQuery(() => ({
		queryKey: ['raids', raidSlug],
		queryFn: () => raidAdapter.getBySlug(raidSlug ?? ''),
		enabled: !!raidSlug
	}))

	const raid = $derived(raidQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Navigate to edit
	function handleEdit() {
		goto(`/database/raids/${raidSlug}/edit`)
	}

	// Navigate back
	function handleBack() {
		goto('/database/raids')
	}

	// Navigate to group detail
	function handleGroupClick() {
		if (raid?.group?.id) {
			goto(`/database/raid-groups/${raid.group.id}`)
		}
	}
</script>

<div class="page">
	{#if raidQuery.isLoading}
		<div class="loading-state">
			<p>Loading raid...</p>
		</div>
	{:else if raidQuery.isError}
		<div class="error-state">
			<p>Failed to load raid</p>
			<Button variant="secondary" onclick={handleBack}>Back to Raids</Button>
		</div>
	{:else if raid}
		<SidebarHeader title={displayName(raid)}>
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleBack}>Back</Button>
			{/snippet}
			{#snippet rightAccessory()}
				{#if canEdit}
					<Button variant="primary" size="small" onclick={handleEdit}>Edit</Button>
				{/if}
			{/snippet}
		</SidebarHeader>

		<section class="details">
			<DetailsContainer title="Raid Details">
				<DetailItem label="Name (EN)" value={raid.name.en || '-'} />
				<DetailItem label="Name (JA)" value={raid.name.ja || '-'} />
				<DetailItem label="Slug" value={raid.slug || '-'} />
				<DetailItem label="Level" value={raid.level?.toString() ?? '-'} />
				<DetailItem label="Element">
					{#if raid.element !== undefined && raid.element !== null}
						<ElementBadge element={raid.element} />
					{:else}
						<span class="no-value">-</span>
					{/if}
				</DetailItem>
			</DetailsContainer>

			<DetailsContainer title="Classification">
				<DetailItem label="Group">
					{#if raid.group}
						<button class="group-link" onclick={handleGroupClick}>
							{displayName(raid.group)}
						</button>
					{:else}
						<span class="no-value">-</span>
					{/if}
				</DetailItem>
				{#if raid.group}
					<DetailItem label="Difficulty" value={raid.group.difficulty?.toString() ?? '-'} />
					<DetailItem label="HL">
						<span class="badge" class:active={raid.group.hl}>{raid.group.hl ? 'Yes' : 'No'}</span>
					</DetailItem>
					<DetailItem label="Extra">
						<span class="badge" class:active={raid.group.extra}>{raid.group.extra ? 'Yes' : 'No'}</span>
					</DetailItem>
					<DetailItem label="Guidebooks">
						<span class="badge" class:active={raid.group.guidebooks}>{raid.group.guidebooks ? 'Yes' : 'No'}</span>
					</DetailItem>
				{/if}
			</DetailsContainer>

		</section>
	{:else}
		<div class="not-found">
			<h2>Raid Not Found</h2>
			<p>The raid you're looking for could not be found.</p>
			<Button variant="secondary" onclick={handleBack}>Back to Raids</Button>
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
		background: white;
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state,
	.error-state {
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

	.details {
		display: flex;
		flex-direction: column;
	}

	.no-value {
		color: var(--text-tertiary);
	}

	.group-link {
		background: none;
		border: none;
		color: var(--link-color, #007bff);
		cursor: pointer;
		font-size: inherit;
		padding: 0;
		text-decoration: underline;

		&:hover {
			color: var(--link-hover-color, #0056b3);
		}
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: typography.$font-small;
		background: #f0f0f0;
		color: #666;

		&.active {
			background: #28a745;
			color: white;
		}
	}
</style>
