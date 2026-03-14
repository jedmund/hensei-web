
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { ArtifactScore } from '$lib/types/api/artifact'

	interface Props {
		score: ArtifactScore | null
		/** Whether to show the attack/defense/special breakdown (default: true) */
		showBreakdown?: boolean
		/** Size variant */
		size?: 'small' | 'medium' | 'large'
	}

	const { score, showBreakdown = true, size = 'medium' }: Props = $props()

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
		<div class="score-header">
			<span class="total-score" style:color={scoreColor(score.total)}>
				{score.total}
			</span>
		</div>

		{#if showBreakdown}
			<div class="breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">{m.artifact_score_atk()}</span>
					<span class="breakdown-value">{score.attack}</span>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">{m.artifact_score_def()}</span>
					<span class="breakdown-value">{score.defense}</span>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">{m.artifact_score_special()}</span>
					<span class="breakdown-value">{score.special}</span>
				</div>
			</div>
		{/if}
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

		display: flex;
		flex-direction: column;
		gap: spacing.$unit;

		:global(html[data-theme='dark']) & {
			--score-high: #ffe066;
			--score-good: #86efac;
			--score-low: #fca5a5;
		}
	}

	.score-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.total-score {
		font-size: 2rem;
		font-weight: typography.$bold;
		line-height: 1;
	}

	.breakdown {
		display: flex;
		gap: spacing.$unit-2x;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
	}

	.breakdown-item {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		flex: 1;
	}

	.breakdown-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.breakdown-value {
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
		.total-score {
			font-size: 1.25rem;
		}
	}

	.size-large {
		.total-score {
			font-size: 3rem;
		}
	}
</style>
