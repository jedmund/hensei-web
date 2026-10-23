<script lang="ts">
	/**
	 * EconomySection - the Sephira coins an expedition obtained and how many
	 * shop purchases it made.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import type { SolomonisStats } from '$lib/types/api/solomonis'

	interface Props {
		stats: SolomonisStats
	}

	let { stats }: Props = $props()

	function orDash(value: number | null | undefined): string {
		return value === null || value === undefined ? '—' : String(value)
	}
</script>

<DetailsSection title={m.solomonis_web_party_economy()}>
	<div class="rows">
		<DetailRow label={m.solomonis_web_party_points_earned()} value={orDash(stats.pointsEarned)} />
		<DetailRow label={m.solomonis_web_party_shop_purchases()} value={orDash(stats.shopPurchases)} />
	</div>
</DetailsSection>

<style lang="scss">
	.rows {
		display: flex;
		flex-direction: column;
	}
</style>
