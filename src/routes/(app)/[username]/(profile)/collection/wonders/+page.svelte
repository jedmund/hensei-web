<script lang="ts">
	/**
	 * A profile's Wonders, grouped by the game's categories. Inactive ones are
	 * dimmed. The layout hides the page when collection privacy forbids it;
	 * the API enforces it too (403), which shows the private state here.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import type { PageData } from './$types'
	import Icon from '$lib/components/Icon.svelte'
	import WonderCard from '$lib/components/wonders/WonderCard.svelte'
	import { openCollectionWonderPane } from '$lib/components/wonders/openCollectionWonderPanes'
	import { wonderQueries } from '$lib/api/queries/wonder.queries'
	import { groupByCategory, joinWonders } from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'

	const { data }: { data: PageData } = $props()

	const catalogueQuery = createQuery(() => wonderQueries.catalogue())
	const collectionQuery = createQuery(() => wonderQueries.collection(data.user?.id ?? ''))

	const groups = $derived.by(() => {
		const catalogue = catalogueQuery.data
		if (!catalogue || !collectionQuery.data) return []
		return groupByCategory(joinWonders(collectionQuery.data, catalogue), (j) => j.wonder, catalogue)
	})

	const isLoading = $derived(catalogueQuery.isLoading || collectionQuery.isLoading)
	const isError = $derived(catalogueQuery.isError || collectionQuery.isError)
</script>

<div class="wonders-page">
	{#if isLoading}
		<div class="state">
			<Icon name="loader-2" size={32} />
			<p>{m.collection_loading()}</p>
		</div>
	{:else if isError || groups.length === 0}
		<div class="state">
			{#if data.isOwner && !isError}
				<Icon name="gem" size={48} />
				<h3>{m.wonders_empty()}</h3>
				<p>{m.wonders_empty_hint()}</p>
			{:else if data.isOwner}
				<p>{m.collection_load_error()}</p>
			{:else}
				<Icon name="lock" size={48} />
				<p>{m.collection_empty_private()}</p>
			{/if}
		</div>
	{:else}
		{#each groups as group (group.category.id)}
			<section class="category">
				<h3 class="category-name">{wonderText(group.category.name)}</h3>
				<div class="wonder-grid">
					{#each group.items as item (item.row.id)}
						<WonderCard
							wonder={item.wonder}
							row={item.row}
							size={104}
							levelBadge
							onclick={() => openCollectionWonderPane(item.wonder, item.row, data.isOwner)}
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.wonders-page {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
		min-height: 400px;
	}

	.category {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.category-name {
		margin: 0;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.wonder-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: $unit-3x $unit-2x;
		justify-items: center;

		@media (max-width: 600px) {
			grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
			gap: $unit-2x $unit;
		}
	}

	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		gap: $unit;
		color: var(--text-secondary);
		text-align: center;

		:global(svg) {
			color: var(--icon-secondary);
		}

		p,
		h3 {
			margin: 0;
		}

		h3 {
			color: var(--text-primary);
		}
	}
</style>
