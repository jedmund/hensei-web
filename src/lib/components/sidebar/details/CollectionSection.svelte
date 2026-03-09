<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { authStore } from '$lib/stores/auth.store.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		granblueId: string | undefined
	}

	let { type, granblueId }: Props = $props()

	const userId = $derived(authStore.user?.id ?? '')

	const itemCountQuery = createQuery(() =>
		collectionQueries.itemCount(userId, type, granblueId ?? '', !!userId && !!granblueId)
	)

	const count = $derived(itemCountQuery.data?.count ?? 0)
</script>

{#if userId && itemCountQuery.isSuccess}
	<div class="collection-section">
		<span>{count} in your Collection</span>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.collection-section {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		margin: 0 spacing.$unit-2x;
		background: var(--surface-secondary);
		border-radius: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
