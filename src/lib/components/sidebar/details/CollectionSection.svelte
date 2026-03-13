<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		count: number
		gridCount?: number
		element: number | undefined
		hasCollection?: boolean
		sourceUsername?: string
		isOutOfSync?: boolean
		isSyncing?: boolean
		onSync?: () => void
	}

	let { type, count, element, gridCount, hasCollection = false, sourceUsername, isOutOfSync = false, isSyncing = false, onSync }: Props = $props()

	const isOwnCollection = $derived(!sourceUsername)
	const isInsufficient = $derived(
		(type === 'weapon' && gridCount != null && count < gridCount) ||
		(type !== 'weapon' && count === 0)
	)

	const ELEMENT_NAMES: Record<number, string> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	const elementName = $derived(element ? ELEMENT_NAMES[element] ?? 'null' : 'null')
</script>

{#if hasCollection || isOutOfSync}
	<div class="collection-section-wrapper">
		<div
			class="collection-section"
			class:insufficient={isInsufficient}
			style:background={isInsufficient ? 'var(--button-bg)' : `var(--${elementName}-nav-selected-bg)`}
			style:color={isInsufficient ? 'var(--danger)' : `var(--${elementName}-nav-selected-text)`}
		>
			{#if type === 'character' && count > 0}
				<span>{isOwnCollection ? m.details_collection_in_your() : m.details_collection_in_other({ owner: sourceUsername ?? '' })}</span>
			{:else if type === 'character'}
				<span>{isOwnCollection ? m.details_collection_not_in_your() : m.details_collection_not_in_other({ owner: sourceUsername ?? '' })}</span>
			{:else if type === 'weapon' && gridCount != null}
				<span>{isOwnCollection ? m.details_collection_count_grid_your({ count: String(count), gridCount: String(gridCount) }) : m.details_collection_count_grid_other({ count: String(count), gridCount: String(gridCount), owner: sourceUsername ?? '' })}</span>
			{:else}
				<span>{isOwnCollection ? m.details_collection_count_your({ count: String(count) }) : m.details_collection_count_other({ count: String(count), owner: sourceUsername ?? '' })}</span>
			{/if}
		</div>

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
				<button class="sync-button" onclick={onSync} disabled={isSyncing}>
					{isSyncing ? m.details_collection_syncing() : m.details_collection_sync()}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
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
		border-radius: spacing.$unit;
		font-size: typography.$font-small;
	}

	.sync-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		background: var(--button-bg);
		border-radius: spacing.$unit;
		gap: spacing.$unit;
	}

	.sync-message {
		display: flex;
		align-items: center;
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

	.sync-button {
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
		background: var(--card-bg);
		border: 1px solid var(--button-border);
		border-radius: spacing.$unit-half;
		cursor: pointer;
		flex-shrink: 0;
		@include smooth-transition($duration-quick, background-color);

		&:hover:not(:disabled) {
			background: var(--button-bg-hover);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
</style>
