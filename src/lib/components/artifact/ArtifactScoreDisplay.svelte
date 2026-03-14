
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { ArtifactScore } from '$lib/types/api/artifact'

	interface Props {
		score: ArtifactScore | null
		/** Size variant */
		size?: 'small' | 'medium' | 'large'
	}

	const { score, size = 'medium' }: Props = $props()

	/**
	 * Returns a CSS color based on the total score value.
	 * Low scores are red, mid scores are neutral, high scores are green/gold.
	 */
	function scoreColor(total: number): string {
		if (total >= 27) return 'var(--score-high)'
		if (total >= 23) return 'var(--score-good)'
		return 'var(--score-low)'
	}
</script>

<div class="score-display" class:size-small={size === 'small'} class:size-large={size === 'large'}>
	{#if score}
		<div class="score-row">
			<div class="score-item">
				<span class="score-label">{m.artifact_score_atk()}</span>
				<span class="score-value">{score.attack}</span>
			</div>
			<div class="score-item">
				<span class="score-label">{m.artifact_score_def()}</span>
				<span class="score-value">{score.defense}</span>
			</div>
			<div class="score-item">
				<span class="score-label">{m.artifact_score_special()}</span>
				<span class="score-value">{score.special}</span>
			</div>
			<div class="score-item total">
				<span class="score-label">{m.artifact_score_total()}</span>
				<span class="score-value" style:color={scoreColor(score.total)}>{score.total}</span>
			</div>
		</div>
	{:else}
		<div class="no-score">
			<span class="no-score-text">{m.artifact_no_score()}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.score-display {
		flex: 1;
		--score-high: #b8860b;
		--score-good: #e67e22;
		--score-low: #dc2626;
		--score-none: var(--text-tertiary);

		:global(html[data-theme='dark']) & {
			--score-high: #daa520;
			--score-good: #f59e0b;
			--score-low: #f87171;
		}
	}

	.score-row {
		display: flex;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--grey-90, #f0f0f0);
		border-radius: layout.$item-corner;

		:global(html[data-theme='dark']) & {
			background: var(--grey-15, #262626);
		}
	}

	.score-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-fourth;
		flex: 1;

		&.total {
			.score-value {
				font-weight: typography.$bold;
			}
		}
	}

	.score-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.score-value {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.no-score {
		padding: spacing.$unit;
	}

	.no-score-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-style: italic;
	}

	// Size variants
	.size-small {
		.score-value {
			font-size: typography.$font-small;
		}
	}

	.size-large {
		.score-value {
			font-size: typography.$font-body;
		}
	}
</style>
