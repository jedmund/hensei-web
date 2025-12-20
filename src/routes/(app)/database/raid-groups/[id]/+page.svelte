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

	// Get group ID from URL
	const groupId = $derived($page.params.id)

	// Query for group data
	const groupQuery = createQuery(() => ({
		queryKey: ['raid-groups', groupId],
		queryFn: () => raidAdapter.getGroupById(groupId ?? ''),
		enabled: !!groupId
	}))

	const group = $derived(groupQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Navigate to edit
	function handleEdit() {
		goto(`/database/raid-groups/${groupId}/edit`)
	}

	// Navigate back
	function handleBack() {
		goto('/database/raids?view=groups')
	}

	// Navigate to raid detail
	function handleRaidClick(slug: string) {
		goto(`/database/raids/${slug}`)
	}
</script>

<div class="page">
	{#if groupQuery.isLoading}
		<div class="loading-state">
			<p>Loading raid group...</p>
		</div>
	{:else if groupQuery.isError}
		<div class="error-state">
			<p>Failed to load raid group</p>
			<Button variant="secondary" onclick={handleBack}>Back to Groups</Button>
		</div>
	{:else if group}
		<SidebarHeader title={displayName(group)}>
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
			<DetailsContainer title="Group Details">
				<DetailItem label="Name (EN)" value={group.name.en || '-'} />
				<DetailItem label="Name (JA)" value={group.name.ja || '-'} />
				<DetailItem label="Section" value={group.section?.toString() ?? '-'} />
				<DetailItem label="Order" value={group.order?.toString() ?? '-'} />
				<DetailItem label="Difficulty" value={group.difficulty?.toString() ?? '-'} />
			</DetailsContainer>

			<DetailsContainer title="Flags">
				<DetailItem label="HL">
					<span class="badge" class:active={group.hl}>{group.hl ? 'Yes' : 'No'}</span>
				</DetailItem>
				<DetailItem label="Extra">
					<span class="badge" class:active={group.extra}>{group.extra ? 'Yes' : 'No'}</span>
				</DetailItem>
				<DetailItem label="Guidebooks">
					<span class="badge" class:active={group.guidebooks}>{group.guidebooks ? 'Yes' : 'No'}</span>
				</DetailItem>
				<DetailItem label="Unlimited">
					<span class="badge" class:active={group.unlimited}>{group.unlimited ? 'Yes' : 'No'}</span>
				</DetailItem>
			</DetailsContainer>

			{#if group.raids && group.raids.length > 0}
				<DetailsContainer title="Member Raids ({group.raids.length})">
					<div class="raids-list">
						{#each group.raids as raid}
							<button class="raid-item" onclick={() => handleRaidClick(raid.slug)}>
								<span class="raid-name">{displayName(raid)}</span>
								<span class="raid-level">Lv. {raid.level ?? '-'}</span>
							</button>
						{/each}
					</div>
				</DetailsContainer>
			{/if}

		</section>
	{:else}
		<div class="not-found">
			<h2>Raid Group Not Found</h2>
			<p>The raid group you're looking for could not be found.</p>
			<Button variant="secondary" onclick={handleBack}>Back to Groups</Button>
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

	.raids-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
	}

	.raid-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: #f8f9fa;
		border: 1px solid #e5e5e5;
		border-radius: layout.$item-corner;
		cursor: pointer;
		text-align: left;

		&:hover {
			background: #e9ecef;
		}

		.raid-name {
			font-weight: typography.$bold;
		}

		.raid-level {
			color: var(--text-secondary);
			font-size: typography.$font-small;
		}
	}
</style>
