<script lang="ts">
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	type Element = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		/** 'all' renders "Sync all" + all-scoped subtitles; 'section' / 'row' render "Sync". */
		target?: 'all' | 'section' | 'row'
		element?: Element | undefined
		canPull?: boolean
		canPush?: boolean
		isSyncing?: boolean
		isSyncingToCollection?: boolean
		onSyncFromCollection?: () => void
		/** Called with the chosen scope so the parent can open the confirmation dialog. */
		onSyncToCollection?: () => void
	}

	let {
		type,
		target = 'section',
		element,
		canPull = false,
		canPush = false,
		isSyncing = false,
		isSyncingToCollection = false,
		onSyncFromCollection,
		onSyncToCollection
	}: Props = $props()

	const typeLabel = $derived(
		type === 'character'
			? m.type_character()
			: type === 'weapon'
				? m.type_weapon()
				: m.type_summon()
	)

	const triggerLabel = $derived(
		isSyncing || isSyncingToCollection
			? m.details_collection_syncing()
			: target === 'all'
				? m.details_collection_sync_all()
				: m.details_collection_sync()
	)

	const pullSubtitle = $derived(
		target === 'all'
			? m.details_collection_sync_pull_all_subtitle({ type: typeLabel })
			: m.details_collection_sync_pull_subtitle({ type: typeLabel })
	)

	const pushSubtitle = $derived(
		target === 'all'
			? m.details_collection_sync_push_all_subtitle({ type: typeLabel })
			: m.details_collection_sync_push_subtitle({ type: typeLabel })
	)

	const hasAnyItem = $derived(canPull || canPush)
</script>

{#if hasAnyItem}
	<DropdownMenu>
		{#snippet trigger({ props })}
			<Button
				variant={element ? 'element-ghost' : 'ghost'}
				{element}
				size="small"
				disabled={isSyncing || isSyncingToCollection}
				{...props}
			>
				{triggerLabel}
				{#snippet rightAccessory()}
					<Icon name="chevron-down-small" size={12} />
				{/snippet}
			</Button>
		{/snippet}

		{#snippet menu()}
			{#if canPull}
				<DropdownMenuBase.Item
					class="dropdown-menu-item sync-menu-item"
					onSelect={() => onSyncFromCollection?.()}
				>
					<span class="title">{m.details_collection_sync_pull()}</span>
					<span class="subtitle">{pullSubtitle}</span>
				</DropdownMenuBase.Item>
			{/if}
			{#if canPush}
				<DropdownMenuBase.Item
					class="dropdown-menu-item sync-menu-item"
					onSelect={() => onSyncToCollection?.()}
				>
					<span class="title">{m.details_collection_sync_push()}</span>
					<span class="subtitle">{pushSubtitle}</span>
				</DropdownMenuBase.Item>
			{/if}
		{/snippet}
	</DropdownMenu>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	:global(.sync-menu-item) {
		flex-direction: column !important;
		align-items: flex-start !important;
		gap: 2px !important;
	}

	:global(.sync-menu-item .title) {
		font-size: typography.$font-regular;
		font-weight: 500;
		color: var(--text-primary);
	}

	:global(.sync-menu-item .subtitle) {
		font-size: typography.$font-tiny;
		color: var(--text-secondary);
		white-space: normal;
		max-width: 260px;
	}
</style>
