<script lang="ts">
	interface Props {
		itemData: any
		gridUncapLevel: number | null
		gridTranscendence: number | null
	}

	let { itemData, gridUncapLevel, gridTranscendence }: Props = $props()
</script>

<div class="details-section">
	{#if itemData?.hp && itemData?.atk}
		<div class="stats-grid">
			<div class="grid-header empty"></div>
			<div class="grid-header">HP</div>
			<div class="grid-header">ATK</div>

			<div class="grid-label">Base</div>
			<div class="grid-value">{itemData.hp.minHp ?? '—'}</div>
			<div class="grid-value">{itemData.atk.minAtk ?? '—'}</div>

			<div class="grid-label">MLB</div>
			<div class="grid-value">{itemData.hp.maxHp ?? '—'}</div>
			<div class="grid-value">{itemData.atk.maxAtk ?? '—'}</div>

			{#if itemData.uncap?.flb && (itemData.hp.maxHpFlb || itemData.atk.maxAtkFlb)}
				<div class="grid-label">FLB</div>
				<div class="grid-value">{itemData.hp.maxHpFlb ?? '—'}</div>
				<div class="grid-value">{itemData.atk.maxAtkFlb ?? '—'}</div>
			{/if}

			{#if itemData.uncap?.ulb && (itemData.hp.maxHpUlb || itemData.atk.maxAtkUlb)}
				<div class="grid-label">ULB</div>
				<div class="grid-value">{itemData.hp.maxHpUlb ?? '—'}</div>
				<div class="grid-value">{itemData.atk.maxAtkUlb ?? '—'}</div>
			{/if}

			{#if gridTranscendence && gridTranscendence > 0}
				<div class="grid-label">T5</div>
				<div class="grid-value">{itemData.hp.maxHpXlb ?? '—'}</div>
				<div class="grid-value">{itemData.atk.maxAtkXlb ?? '—'}</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-section {
		padding: 0 spacing.$unit;

		h3 {
			margin: 0 0 calc(spacing.$unit * 1.5) 0;
			font-size: typography.$font-name;
			font-weight: typography.$medium;
			color: var(--text-primary);
			padding: 0 spacing.$unit;
		}

		h4 {
			margin: calc(spacing.$unit * 1.5) 0 spacing.$unit 0;
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-secondary, colors.$grey-50);
		}
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 0.5fr 1fr 1fr;
		background: var(--page-bg);
		gap: spacing.$unit-half;
		border: 1px solid colors.$grey-80;
		border-radius: layout.$card-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
		padding: spacing.$unit;

		.grid-header {
			padding: spacing.$unit;
			background: var(--button-bg-hover);
			font-weight: typography.$medium;
			color: var(--menu-text);
			border-bottom: 1px solid var(--border-primary);
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: layout.$item-corner;

			&.empty {
				background: transparent;
			}

			&:not(:first-child) {
				border-left: 1px solid var(--border-primary);
			}
		}

		.grid-label {
			padding: spacing.$unit;
			background: var(--button-bg-hover);
			font-weight: typography.$medium;
			color: var(--menu-text);
			border-radius: layout.$item-corner;
			justify-content: center;
			display: flex;
			align-items: center;
		}

		.grid-value {
			padding: spacing.$unit;
			border-radius: layout.$item-corner;
			text-align: right;
			font-weight: typography.$medium;
			font-size: typography.$font-regular;
			font-variant-numeric: tabular-nums;
			color: var(--menu-text);
			border-bottom: 1px solid var(--border-primary);
			border-left: 1px solid var(--border-primary);
			display: flex;
			align-items: center;
			justify-content: flex-end;

			&:hover {
				background: var(--button-bg-hover);
			}
		}

		// Remove border from last row
		.grid-label:last-of-type,
		.grid-value:last-of-type {
			border-bottom: none;
		}
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;

		&:hover {
			background: var(--page-hover);
			border-radius: layout.$item-corner;
		}

		&:last-child {
			border-bottom: none;
		}

		.label {
			font-size: typography.$font-regular;
			color: var(--text-secondary, colors.$grey-50);
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary, colors.$grey-10);
			font-weight: typography.$medium;
			text-align: right;
		}
	}

	.stats-group {
		margin-bottom: spacing.$unit-2x;

		&:last-child {
			margin-bottom: 0;
		}
	}
</style>
