<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getElementKey } from '$lib/utils/element'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		count: number
		gridCount?: number
		element: number | undefined
		hasCollection?: boolean
		sourceUsername?: string
		isOutOfSync?: boolean
		isPartyOwner?: boolean
		isCollectionOwner?: boolean
		isSyncing?: boolean
		isSyncingToCollection?: boolean
		onSync?: () => void
		onSyncToCollection?: () => void
	}

	let {
		type,
		count,
		element,
		gridCount,
		hasCollection = false,
		sourceUsername,
		isOutOfSync = false,
		isPartyOwner = false,
		isCollectionOwner = false,
		isSyncing = false,
		isSyncingToCollection = false,
		onSync,
		onSyncToCollection
	}: Props = $props()

	const isOwnCollection = $derived(!sourceUsername)
	const isInsufficient = $derived(
		(type === 'weapon' && gridCount != null && count < gridCount) ||
			(type !== 'weapon' && count === 0)
	)

	const typeLabel = $derived(
		type === 'character'
			? m.type_character()
			: type === 'weapon'
				? m.type_weapon()
				: m.type_summon()
	)

	const elementName = $derived(element ? getElementKey(element) : 'null')
</script>

{#if hasCollection || isOutOfSync}
	<div class="collection-section-wrapper">
		{#if !isOutOfSync}
			<div
				class="collection-section"
				class:insufficient={isInsufficient}
				style:background={isInsufficient
					? 'var(--button-bg)'
					: `var(--${elementName}-nav-selected-bg)`}
				style:color={isInsufficient ? 'var(--danger)' : `var(--${elementName}-nav-selected-text)`}
			>
				{#if type === 'character' && count > 0}
					<span
						>{isOwnCollection
							? m.details_collection_in_your()
							: m.details_collection_in_other({ owner: sourceUsername ?? '' })}</span
					>
				{:else if type === 'character'}
					<span
						>{isOwnCollection
							? m.details_collection_not_in_your()
							: m.details_collection_not_in_other({ owner: sourceUsername ?? '' })}</span
					>
				{:else if type === 'weapon' && gridCount != null}
					<span
						>{isOwnCollection
							? m.details_collection_count_grid_your({
									count: String(count),
									gridCount: String(gridCount)
								})
							: m.details_collection_count_grid_other({
									count: String(count),
									gridCount: String(gridCount),
									owner: sourceUsername ?? ''
								})}</span
					>
				{:else}
					<span
						>{isOwnCollection
							? m.details_collection_count_your({ count: String(count) })
							: m.details_collection_count_other({
									count: String(count),
									owner: sourceUsername ?? ''
								})}</span
					>
				{/if}
			</div>
		{/if}

		{#if isOutOfSync}
			<div class="sync-banner">
				<div class="sync-message">
					<span>{m.details_collection_out_of_sync()}</span>
					<Tooltip content={m.details_collection_sync_tooltip()}>
						<span class="help-icon">
							<Icon name="circle-help" size={14} />
						</span>
					</Tooltip>
				</div>
				{#if isPartyOwner || isCollectionOwner}
					<div class="sync-buttons">
						{#if isPartyOwner}
							<Button
								variant="raised"
								size="small"
								class="sync-button"
								onclick={onSync}
								disabled={isSyncing}
							>
								{isSyncing
									? m.details_collection_syncing()
									: m.details_collection_sync_item({ type: typeLabel })}
							</Button>
						{/if}
						{#if isCollectionOwner}
							<Button
								variant="raised"
								size="small"
								class="sync-button"
								onclick={onSyncToCollection}
								disabled={isSyncingToCollection}
							>
								{isSyncingToCollection
									? m.details_collection_syncing_collection()
									: m.details_collection_sync_collection()}
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as *;

	.collection-section-wrapper {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		margin: 0 spacing.$unit-2x;
	}

	.collection-section {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		border-radius: layout.$item-corner;
		font-size: typography.$font-small;
	}

	.sync-banner {
		display: flex;
		flex-direction: column;
		padding: spacing.$unit-2x;
		background: var(--button-contained-bg);
		border-radius: layout.$card-corner;
		gap: spacing.$unit;
	}

	.sync-message {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.help-icon {
		display: inline-flex;
		align-items: center;
		color: var(--text-tertiary);
		cursor: help;
		@include smooth-transition($duration-quick, color);

		&:hover {
			color: var(--text-secondary);
		}
	}

	.sync-buttons {
		display: flex;
		gap: spacing.$unit-half;

		:global(.sync-button) {
			flex: 1;
		}
	}
</style>
