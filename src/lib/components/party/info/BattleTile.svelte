<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'

	interface Props {
		// Settings
		fullAuto?: boolean
		autoGuard?: boolean
		autoSummon?: boolean
		chargeAttack?: boolean
		// Performance
		clearTime?: number | null
		buttonCount?: number | null
		chainCount?: number | null
		summonCount?: number | null
		// Tile props
		clickable?: boolean
		onclick?: () => void
	}

	let {
		fullAuto,
		autoGuard,
		autoSummon,
		chargeAttack,
		clearTime,
		buttonCount,
		chainCount,
		summonCount,
		clickable = false,
		onclick
	}: Props = $props()

	// Settings tokens
	interface Setting {
		key: string
		label: string
		tooltip: string
		active: boolean
	}

	const settings: Setting[] = $derived([
		{ key: 'chargeAttack', label: `CA ${chargeAttack ?? true ? 'On' : 'Off'}`, tooltip: 'Charge Attack', active: chargeAttack ?? true },
		{ key: 'fullAuto', label: `FA ${fullAuto ? 'On' : 'Off'}`, tooltip: 'Full Auto', active: fullAuto ?? false },
		{ key: 'autoSummon', label: `AS ${autoSummon ? 'On' : 'Off'}`, tooltip: 'Auto Summon', active: autoSummon ?? false },
		{ key: 'autoGuard', label: `AG ${autoGuard ? 'On' : 'Off'}`, tooltip: 'Auto Guard', active: autoGuard ?? false }
	])

	// Performance display - only show non-null values
	function formatClearTime(seconds?: number | null): string | null {
		if (seconds == null || seconds <= 0) return null
		const minutes = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}

	const formattedClearTime = $derived(formatClearTime(clearTime))

	// Build BCS string with only non-null values
	const bcsItems = $derived(() => {
		const items: string[] = []
		if (buttonCount != null) items.push(`${buttonCount}B`)
		if (chainCount != null) items.push(`${chainCount}C`)
		if (summonCount != null) items.push(`${summonCount}S`)
		return items
	})

	const hasPerformanceData = $derived(formattedClearTime || bcsItems().length > 0)
</script>

<InfoTile label="Battle" class="battle-tile" {clickable} {onclick}>
	<div class="battle-content">
		<!-- Settings tokens -->
		<div class="settings-tokens">
			{#each settings as setting (setting.key)}
				<Tooltip content={setting.tooltip}>
					<span class="token {setting.key}" class:on={setting.active} class:off={!setting.active}>
						{setting.label}
					</span>
				</Tooltip>
			{/each}
		</div>

		<!-- Performance metrics (only if any exist) -->
		{#if hasPerformanceData}
			<div class="performance">
				{#if formattedClearTime}
					<div class="clear-time">
						<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<span class="value">{formattedClearTime}</span>
					</div>
				{/if}
				{#if bcsItems().length > 0}
					<div class="bcs-counts">
						<span class="bcs-value">{bcsItems().join(' ')}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.battle-content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	// Settings tokens
	.settings-tokens {
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
	}

	.token {
		display: inline-flex;
		align-items: center;
		padding: $unit-three-quarter $unit-2x;
		border-radius: $full-corner;
		font-size: $font-small;
		font-weight: $bold;
		line-height: 1.4;
		text-align: center;
		user-select: none;
		background: var(--input-bg);

		&.off {
			color: var(--text-secondary);
		}

		&.chargeAttack.on {
			background: var(--charge-attack-bg);
			color: var(--charge-attack-text);
		}

		&.fullAuto.on,
		&.autoSummon.on {
			background: var(--full-auto-bg);
			color: var(--full-auto-text);
		}

		&.autoGuard.on {
			background: var(--auto-guard-bg);
			color: var(--auto-guard-text);
		}
	}

	// Performance metrics
	.performance {
		display: flex;
		align-items: center;
		gap: $unit-2x;
	}

	.clear-time {
		display: flex;
		align-items: center;
		gap: $unit;

		.icon {
			width: 18px;
			height: 18px;
			color: var(--text-secondary);
		}

		.value {
			font-size: $font-medium;
			font-weight: $bold;
			font-variant-numeric: tabular-nums;
			color: var(--text-primary);
		}
	}

	.bcs-counts {
		.bcs-value {
			font-size: $font-regular;
			font-weight: $medium;
			font-variant-numeric: tabular-nums;
			color: var(--text-secondary);
			letter-spacing: 0.05em;
		}
	}
</style>
