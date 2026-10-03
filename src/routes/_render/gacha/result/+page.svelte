<script lang="ts">
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import * as m from '$lib/paraglide/messages'

	let { data } = $props()

	// Full pool names; the simulator's select uses shorter ones
	const pools: Record<string, () => string> = {
		premium: m.gacha_pool_premium,
		legend: m.gacha_pool_legend,
		flash: m.gacha_pool_flash,
		classic: m.gacha_classic,
		classic_ii: m.gacha_classic_ii,
		classic_iii: m.gacha_classic_iii
	}
	const seasons: Record<string, () => string> = {
		valentines: m.gacha_valentines,
		summer: m.gacha_summer,
		halloween: m.gacha_halloween,
		holiday: m.gacha_holiday,
		formal: m.gacha_formal
	}

	const config = $derived(data.result.configuration)
	const label = $derived(
		[pools[config.mode]?.() ?? config.mode, config.season ? seasons[config.season]?.() : undefined]
			.filter(Boolean)
			.join(' · ')
	)
</script>

<!-- The renderer screenshots this frame (main > *:first-child) at 1200x630 -->
<div class="frame">
	<GachaResults
		result={data.result}
		operation={data.operation}
		currency={data.currency}
		art={data.art}
		{label}
		target={data.target}
		share
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.frame {
		box-sizing: border-box;
		width: 1200px;
		height: 630px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding: $unit-3x;
		background: var(--page-bg);
		color: var(--text-primary);
		font-family: var(--font-family);
	}
</style>
