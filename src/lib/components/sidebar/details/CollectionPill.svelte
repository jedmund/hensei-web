<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { getElementKey } from '$lib/utils/element'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		/** Whether this item is a single-instance item (character, or limit weapon/summon).
		 * When true, the pill shows bool-style "In/Not in Collection" text regardless of count. */
		isLimitItem?: boolean
		count: number
		/** Only used for non-limit weapons to render "X/Y in your Collection". */
		gridCount?: number | undefined
		element?: number | undefined
		/** When viewing another user's collection, their username for the message. */
		sourceUsername?: string | undefined
		isOutOfSync?: boolean
	}

	let {
		type,
		isLimitItem = false,
		count,
		gridCount,
		element,
		sourceUsername,
		isOutOfSync = false
	}: Props = $props()

	const isOwnCollection = $derived(!sourceUsername)
	const elementName = $derived(element ? getElementKey(element) : 'null')

	// Single-instance items (characters, limit weapons/summons) use the same
	// bool-style copy regardless of the underlying count.
	const useBoolText = $derived(type === 'character' || isLimitItem)
	const owned = $derived(count > 0)

	const isInsufficient = $derived.by(() => {
		if (isOutOfSync) return false
		if (useBoolText) return !owned
		if (type === 'weapon' && gridCount != null) return count < gridCount
		return count === 0
	})
</script>

{#if isOutOfSync}
	<div class="collection-pill out-of-sync">
		<span class="dot" aria-hidden="true"></span>
		<span>{m.details_collection_out_of_sync()}</span>
	</div>
{:else}
	<div
		class="collection-pill"
		class:insufficient={isInsufficient}
		style:background={isInsufficient ? 'var(--button-bg)' : `var(--${elementName}-nav-selected-bg)`}
		style:color={isInsufficient ? 'var(--danger)' : `var(--${elementName}-nav-selected-text)`}
	>
		{#if useBoolText && owned}
			<span
				>{isOwnCollection
					? m.details_collection_in_your()
					: m.details_collection_in_other({ owner: sourceUsername ?? '' })}</span
			>
		{:else if useBoolText}
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

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.collection-pill {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-three-quarter;
		padding: spacing.$unit-three-quarter calc(spacing.$unit * 1.5);
		border-radius: 999px;
		font-size: typography.$font-button;
		font-weight: 500;
		line-height: 1;
		backdrop-filter: blur(8px);
		white-space: nowrap;
	}

	.collection-pill.out-of-sync {
		background: var(--danger-bg, rgba(220, 60, 60, 0.92));
		color: var(--danger-fg, #fff);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}
</style>
