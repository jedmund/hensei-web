<script lang="ts">
	/**
	 * OutcomeLabel - an expedition's outcome: Cleared in green, the miasma
	 * stages in Arcarum purple, Not set muted.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'

	interface Props {
		outcome: SolomonisOutcome | null
	}

	let { outcome }: Props = $props()

	const LABELS: Record<SolomonisOutcome, () => string> = {
		miasma_1: m.solomonis_web_party_outcome_miasma_1,
		miasma_2: m.solomonis_web_party_outcome_miasma_2,
		cleared: m.solomonis_web_party_outcome_cleared
	}
</script>

<span class="outcome {outcome ?? 'not-set'}">
	{outcome ? LABELS[outcome]() : m.solomonis_web_party_not_set()}
</span>

<style lang="scss">
	@use '$src/themes/typography' as *;

	.outcome {
		font-weight: $medium;

		&.cleared {
			color: var(--wind-text);
		}

		&.miasma_1,
		&.miasma_2 {
			color: var(--extra-purple-primary);
		}

		&.not-set {
			color: var(--text-secondary);
		}
	}
</style>
