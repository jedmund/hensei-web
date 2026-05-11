<script lang="ts">
	import type { DifficultyTier } from '$lib/types/api/party'

	interface Props {
		tier: DifficultyTier
		onclick?: () => void
	}

	let { tier, onclick }: Props = $props()

	const scoreRange = $derived(`${tier.minScore ?? 0}–${tier.maxScore ?? 100}`)
	const interactive = $derived(!!onclick)
</script>

{#if interactive}
	<button class="tier-row interactive" {onclick}>
		<span class="swatch" style:background={tier.color || 'var(--input-bg)'}></span>
		<span class="name">{tier.name}</span>
		<span class="slug">{tier.slug}</span>
		<span class="range">{scoreRange}</span>
	</button>
{:else}
	<div class="tier-row">
		<span class="swatch" style:background={tier.color || 'var(--input-bg)'}></span>
		<span class="name">{tier.name}</span>
		<span class="slug">{tier.slug}</span>
		<span class="range">{scoreRange}</span>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.tier-row {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		font-family: inherit;
		color: var(--text-primary);

		.swatch {
			width: 18px;
			height: 18px;
			border-radius: 50%;
			border: 1px solid var(--border-subtle);
			flex-shrink: 0;
		}

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
	}
</style>
