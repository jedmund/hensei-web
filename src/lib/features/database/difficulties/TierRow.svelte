<script lang="ts">
	import type { DifficultyTier } from '$lib/types/api/party'
	import TierIcon from '$lib/features/database/difficulties/TierIcon.svelte'

	interface Props {
		tier: DifficultyTier
		onclick?: () => void
	}

	let { tier, onclick }: Props = $props()

	const scoreRange = $derived(`${tier.minScore ?? 0}–${tier.maxScore ?? 100}`)
	const interactive = $derived(!!onclick)
	const pendingLabel = $derived.by(() => {
		switch (tier.pendingOperation) {
			case 'create':
				return 'New'
			case 'destroy':
				return 'Will delete'
			case 'update':
				return 'Pending'
			default:
				return null
		}
	})
</script>

{#snippet rowContent()}
	<div class="left">
		<TierIcon imageKey={tier.imageKey} color={tier.color} name={tier.name} size={28} />
		<span class="name-info">
			<span class="name">{tier.name}</span>
			<span class="slug">{tier.slug}</span>
		</span>
		{#if pendingLabel}
			<span class="pending-pill" data-operation={tier.pendingOperation}>{pendingLabel}</span>
		{/if}
	</div>
	<span class="range">{scoreRange}</span>
{/snippet}

{#if interactive}
	<button class="tier-row interactive" class:pending={!!pendingLabel} {onclick}>
		{@render rowContent()}
	</button>
{:else}
	<div class="tier-row" class:pending={!!pendingLabel}>
		{@render rowContent()}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.tier-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		font-family: inherit;
		color: var(--text-primary);

		.left {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
		}

		.name-info {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-fourth;

			.name {
				font-size: typography.$font-regular;
				color: var(--text-primary);
				font-weight: typography.$medium;
			}

			.slug {
				font-size: typography.$font-small;
				color: var(--text-tertiary);
				font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			}
		}

		.range {
			font-size: typography.$font-small;
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
			min-width: 80px;
			text-align: right;
		}

		&.interactive {
			cursor: pointer;
			border-radius: layout.$item-corner;
			margin-left: -8px;
			width: calc(100% + 8px);

			&:hover {
				background: var(--page-hover);
			}
		}

		.pending-pill {
			padding: spacing.$unit-fourth spacing.$unit;
			border-radius: layout.$full-corner;
			background: var(--notice-yellow-bg);
			color: var(--notice-yellow-text);
			font-size: typography.$font-tiny;
			text-transform: uppercase;
			letter-spacing: 0.05em;

			&[data-operation='destroy'] {
				background: var(--danger-bg-subtle);
				color: var(--danger);
			}

			&[data-operation='create'] {
				background: var(--accent-green, var(--input-bg));
				color: var(--text-primary);
			}
		}
	}
</style>
