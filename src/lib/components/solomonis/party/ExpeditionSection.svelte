<script lang="ts">
	/**
	 * ExpeditionSection - the details pane's unnamed first section: the
	 * outcome, the turn count when a report brought one, and a link to the
	 * unseal priority pane when the party has sealed items.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'
	import OutcomeLabel from './OutcomeLabel.svelte'

	interface Props {
		outcome: SolomonisOutcome | null
		turnCount?: number | null
		/** Opens the unseal priority pane; no link without it */
		onOpenPriority?: (() => void) | undefined
		/** Shown beside the link, e.g. "Not ranked" */
		priorityValue?: string | undefined
	}

	let { outcome, turnCount = null, onOpenPriority, priorityValue }: Props = $props()
</script>

<!-- Lined up with the DetailsSection rows below -->
<div class="expedition-section">
	<DetailRow label={m.solomonis_web_party_outcome()}>
		<OutcomeLabel {outcome} />
	</DetailRow>
	{#if turnCount != null}
		<DetailRow label={m.solomonis_web_party_turns()} value={turnCount} />
	{/if}
	{#if onOpenPriority}
		<!-- A detail row that opens a pane: same layout, plus a chevron -->
		<button type="button" class="link-row" onclick={onOpenPriority}>
			<span class="label">{m.solomonis_web_grid_priority_title()}</span>
			<span class="value">
				{#if priorityValue}{priorityValue}{/if}
				<Icon name="chevron-right" size={16} />
			</span>
		</button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.expedition-section {
		display: flex;
		flex-direction: column;
		padding: 0 $unit;
	}

	.link-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $unit-2x;
		padding: calc($unit * 1.5) $unit;
		border: none;
		border-radius: layout.$item-corner;
		background: transparent;
		font: inherit;
		font-size: $font-regular;
		text-align: left;
		cursor: pointer;
		transition: background-color effects.$duration-quick ease;

		&:hover {
			background: var(--background);
		}

		.label {
			color: var(--text-secondary);
		}

		.value {
			display: flex;
			align-items: center;
			gap: $unit-half;
			color: var(--text-secondary);
		}

		.value :global(.icon) {
			color: var(--text-tertiary);
		}
	}
</style>
