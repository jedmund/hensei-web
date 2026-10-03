<script lang="ts">
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'

	let { data } = $props()

	const pools: Record<string, () => string> = {
		premium: m.gacha_premium,
		legend: m.gacha_legend,
		flash: m.gacha_flash,
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
	const operations = { draw: m.gacha_draw, until: m.gacha_until, odds: m.gacha_odds }

	const config = $derived(data.result.configuration)
	const subtitle = $derived(
		[
			operations[data.operation](),
			pools[config.mode]?.() ?? config.mode,
			config.season ? seasons[config.season]?.() : undefined,
			data.operation === 'until'
				? undefined
				: `${BigInt(data.result.draws).toLocaleString(getLocale())} ${m.gacha_draws()}`
		]
			.filter(Boolean)
			.join(' · ')
	)
</script>

<!-- The renderer screenshots this frame (main > *:first-child) at 1200x630 -->
<div class="frame">
	<header>
		<span class="title">{m.gacha_title()}</span>
		<span class="subtitle">{subtitle}</span>
		<span class="wordmark">granblue.team</span>
	</header>
	<GachaResults
		result={data.result}
		operation={data.operation}
		currency={data.currency}
		art={data.art}
		share
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.frame {
		box-sizing: border-box;
		width: 1200px;
		height: 630px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: $unit-2x;
		padding: $unit-4x;
		background: var(--page-bg);
		color: var(--text-primary);
		font-family: var(--font-family);
	}

	header {
		display: flex;
		align-items: baseline;
		gap: $unit-2x;
	}

	.title {
		font-size: $font-xlarge;
		font-weight: $bold;
	}

	.subtitle {
		flex: 1;
		color: var(--text-secondary);
		font-size: $font-regular;
	}

	.wordmark {
		color: var(--text-tertiary);
		font-size: $font-regular;
		font-weight: $medium;
	}
</style>
