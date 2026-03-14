
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
		if (total >= 16) return 'var(--score-high)'
		if (total >= 12) return 'var(--score-good)'
		if (total >= 8) return 'var(--score-mid)'
		if (total >= 4) return 'var(--score-low)'
		return 'var(--score-none)'
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
		--score-high: #ffd700;
		--score-good: #4ade80;
		--score-mid: var(--text-primary);
		--score-low: #f87171;
		--score-none: var(--text-tertiary);

		:global(html[data-theme='dark']) & {
			--score-high: #ffe066;
			--score-good: #86efac;
			--score-low: #fca5a5;
		}
	}

	.score-row {
		display: flex;
		gap: spacing.$unit-2x;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
	}

	.score-item {
		display: flex;
		flex-direction: column;
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
		background: var(--card-bg);
		border-radius: layout.$item-corner;
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
