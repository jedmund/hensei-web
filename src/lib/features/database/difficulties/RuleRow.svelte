<script lang="ts">
	import type { DifficultyRule } from '$lib/api/adapters/difficulty.adapter'

	interface Props {
		rule: DifficultyRule
		onclick?: () => void
	}

	let { rule, onclick }: Props = $props()

	const interactive = $derived(!!onclick)
</script>

{#if interactive}
	<button class="rule-row interactive" {onclick} class:inactive={!rule.active}>
		<div class="primary">
			<span class="name">{rule.name}</span>
			<span class="rule-type">{rule.rule_type}</span>
		</div>
		<div class="meta">
			<span class="component-pill" data-component={rule.component}>{rule.component}</span>
			<span class="weight">×{rule.weight}</span>
			{#if !rule.active}
				<span class="status-pill">Inactive</span>
			{/if}
		</div>
	</button>
{:else}
	<div class="rule-row" class:inactive={!rule.active}>
		<div class="primary">
			<span class="name">{rule.name}</span>
			<span class="rule-type">{rule.rule_type}</span>
		</div>
		<div class="meta">
			<span class="component-pill" data-component={rule.component}>{rule.component}</span>
			<span class="weight">×{rule.weight}</span>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.rule-row {
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

		&.inactive {
			opacity: 0.55;
		}

		.primary {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-fourth;
			min-width: 0;
		}

		.name {
			font-size: typography.$font-regular;
			color: var(--text-primary);
			font-weight: typography.$medium;
		}

		.rule-type {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		}

		.meta {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			flex-shrink: 0;
		}

		.component-pill {
			padding: spacing.$unit-fourth spacing.$unit;
			border-radius: layout.$full-corner;
			background: var(--input-bg);
			color: var(--text-secondary);
			font-size: typography.$font-small;
			text-transform: capitalize;
		}

		.weight {
			font-size: typography.$font-small;
			color: var(--text-secondary);
			font-variant-numeric: tabular-nums;
			min-width: 40px;
			text-align: right;
		}

		.status-pill {
			padding: spacing.$unit-fourth spacing.$unit;
			border-radius: layout.$full-corner;
			background: var(--button-bg);
			color: var(--text-tertiary);
			font-size: typography.$font-tiny;
			text-transform: uppercase;
			letter-spacing: 0.05em;
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
