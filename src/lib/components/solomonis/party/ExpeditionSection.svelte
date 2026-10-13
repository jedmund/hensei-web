<script lang="ts">
	/**
	 * ExpeditionSection - the details pane's unnamed first section: the
	 * outcome, and the turn count when a report brought one.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'
	import OutcomeLabel from './OutcomeLabel.svelte'

	interface Props {
		outcome: SolomonisOutcome | null
		turnCount?: number | null
	}

	let { outcome, turnCount = null }: Props = $props()
</script>

<!-- Lined up with the DetailsSection rows below -->
<div class="expedition-section">
	<DetailRow label={m.solomonis_web_party_outcome()}>
		<OutcomeLabel {outcome} />
	</DetailRow>
	{#if turnCount != null}
		<DetailRow label={m.solomonis_web_party_turns()} value={turnCount} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.expedition-section {
		display: flex;
		flex-direction: column;
		padding: 0 $unit;
	}
</style>
