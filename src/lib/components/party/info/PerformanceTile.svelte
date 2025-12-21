<script lang="ts">
	import InfoTile from './InfoTile.svelte'

	interface Props {
		clearTime?: number
		buttonCount?: number
		chainCount?: number
		summonCount?: number
		clickable?: boolean
		onclick?: () => void
	}

	let { clearTime, buttonCount, chainCount, summonCount, clickable = false, onclick }: Props =
		$props()

	function formatClearTime(seconds?: number): string {
		if (seconds == null || seconds <= 0) return '—'
		const minutes = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}

	function formatCount(count?: number): string {
		if (count == null) return '—'
		return count.toString()
	}

	const bcsDisplay = $derived(() => {
		const b = formatCount(buttonCount)
		const c = formatCount(chainCount)
		const s = formatCount(summonCount)
		return `${b}B ${c}C ${s}S`
	})
</script>

<InfoTile label="Performance" class="performance-tile" {clickable} {onclick}>
	<div class="performance-content">
		<div class="clear-time">
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
			<span class="value">{formatClearTime(clearTime)}</span>
		</div>
		<div class="bcs-counts">
			<span class="bcs-value">{bcsDisplay()}</span>
		</div>
	</div>
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.performance-content {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.clear-time {
		display: flex;
		align-items: center;
		gap: $unit;

		.icon {
			width: 20px;
			height: 20px;
			color: var(--text-secondary);
		}

		.value {
			font-size: $font-large;
			font-weight: $bold;
			font-variant-numeric: tabular-nums;
			color: var(--text-primary);
		}
	}

	.bcs-counts {
		.bcs-value {
			font-size: $font-medium;
			font-weight: $medium;
			font-variant-numeric: tabular-nums;
			color: var(--text-secondary);
			letter-spacing: 0.05em;
		}
	}
</style>
