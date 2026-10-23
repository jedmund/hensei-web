<script lang="ts">
	import SyncMenuButton from './SyncMenuButton.svelte'
	import * as m from '$lib/paraglide/messages'

	type Element = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		fieldCount: number
		element?: Element | undefined
		canPull?: boolean
		canPush?: boolean
		isSyncing?: boolean
		isSyncingToCollection?: boolean
		onSyncFromCollection?: () => void
		onSyncToCollection?: () => void
	}

	let {
		type,
		fieldCount,
		element,
		canPull = false,
		canPush = false,
		isSyncing = false,
		isSyncingToCollection = false,
		onSyncFromCollection,
		onSyncToCollection
	}: Props = $props()

	const message = $derived(
		fieldCount === 1
			? m.details_collection_changes_count_singular()
			: m.details_collection_changes_count({ count: String(fieldCount) })
	)
</script>

{#if fieldCount > 0}
	<div class="out-of-sync-banner">
		<span class="message">{message}</span>
		<SyncMenuButton
			{type}
			target="all"
			{element}
			{canPull}
			{canPush}
			{isSyncing}
			{isSyncingToCollection}
			{onSyncFromCollection}
			{onSyncToCollection}
		/>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.out-of-sync-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		margin: 0 spacing.$unit-2x;
		background: var(--button-contained-bg);
		border-radius: layout.$item-corner;
	}

	.message {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
