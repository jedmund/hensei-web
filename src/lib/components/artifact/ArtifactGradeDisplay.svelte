
<script lang="ts">
	import type { ArtifactGrade } from '$lib/types/api/artifact'

	interface Props {
		/** The grade to display */
		grade: ArtifactGrade
		/** Whether to show the full breakdown (default: true) */
		showBreakdown?: boolean
		/** Whether to show the recommendation (default: true) */
		showRecommendation?: boolean
		/** Size variant */
		size?: 'small' | 'medium' | 'large'
	}

	const {
		grade,
		showBreakdown = true,
		showRecommendation = true,
		size = 'medium'
	}: Props = $props()

	// Get grade letter class for styling
	const gradeClass = $derived(grade.letter?.toLowerCase() ?? 'none')

	// Format score as percentage
	const scoreDisplay = $derived(
		grade.score !== null ? `${Math.round(grade.score)}%` : '—'
	)

	// Action display mapping
	const actionLabels: Record<string, { label: string; class: string }> = {
		keep: { label: 'Keep', class: 'action-keep' },
		reroll: { label: 'Reroll', class: 'action-reroll' },
		scrap: { label: 'Scrap', class: 'action-scrap' }
	}
</script>

<div class="grade-display" class:size-small={size === 'small'} class:size-large={size === 'large'}>
	{#if grade.letter}
		<div class="grade-header">
			<div class="grade-letter grade-{gradeClass}">
				{grade.letter}
			</div>
			{#if grade.score !== null}
				<div class="grade-score">{scoreDisplay}</div>
			{/if}
		</div>

		{#if showBreakdown && grade.breakdown}
			<div class="breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">Selection</span>
					<span class="breakdown-value">{grade.breakdown.skillSelection}</span>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">Strength</span>
					<span class="breakdown-value">{grade.breakdown.baseStrength}</span>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">Synergy</span>
					<span class="breakdown-value">{grade.breakdown.synergy}</span>
				</div>
			</div>
		{/if}

		{#if showRecommendation && grade.recommendation}
			{@const action = actionLabels[grade.recommendation.action]}
			<div class="recommendation">
				<span class="action-badge {action?.class ?? ''}">{action?.label ?? grade.recommendation.action}</span>
				{#if grade.recommendation.reason}
					<span class="reason">{grade.recommendation.reason}</span>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="no-grade">
			<span class="no-grade-text">{grade.note ?? 'No grade'}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.grade-display {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.grade-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.grade-letter {
		font-size: 2rem;
		font-weight: typography.$bold;
		line-height: 1;
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner;

		&.grade-s {
			--grade-bg-from: #ffd700;
			--grade-bg-to: #ffb347;
			--grade-text: #6b4c00;

			:global(html[data-theme='dark']) & {
				--grade-bg-from: #a68600;
				--grade-bg-to: #a06e2d;
				--grade-text: #ffe066;
			}

			background: linear-gradient(135deg, var(--grade-bg-from), var(--grade-bg-to));
			color: var(--grade-text);
		}
		&.grade-a {
			--grade-bg-from: #4ade80;
			--grade-bg-to: #22c55e;
			--grade-text: #14532d;

			:global(html[data-theme='dark']) & {
				--grade-bg-from: #166534;
				--grade-bg-to: #15803d;
				--grade-text: #86efac;
			}

			background: linear-gradient(135deg, var(--grade-bg-from), var(--grade-bg-to));
			color: var(--grade-text);
		}
		&.grade-b {
			--grade-bg-from: #60a5fa;
			--grade-bg-to: #3b82f6;
			--grade-text: #1e3a5f;

			:global(html[data-theme='dark']) & {
				--grade-bg-from: #1e3a8a;
				--grade-bg-to: #1d4ed8;
				--grade-text: #93c5fd;
			}

			background: linear-gradient(135deg, var(--grade-bg-from), var(--grade-bg-to));
			color: var(--grade-text);
		}
		&.grade-c {
			background: var(--placeholder-bg);
			color: var(--text-primary);
		}
		&.grade-d {
			background: var(--separator-bg);
			color: var(--text-secondary);
		}
		&.grade-f {
			--grade-bg-from: #f87171;
			--grade-bg-to: #ef4444;
			--grade-text: #7f1d1d;

			:global(html[data-theme='dark']) & {
				--grade-bg-from: #7f1d1d;
				--grade-bg-to: #991b1b;
				--grade-text: #fca5a5;
			}

			background: linear-gradient(135deg, var(--grade-bg-from), var(--grade-bg-to));
			color: var(--grade-text);
		}
		&.grade-none {
			background: var(--unit-bg);
			color: var(--text-secondary);
		}
	}

	.grade-score {
		font-size: typography.$font-large;
		font-weight: typography.$medium;
		color: var(--text-secondary);
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

	.recommendation {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: spacing.$unit;
		flex-wrap: wrap;
	}

	.action-badge {
		display: inline-flex;
		padding: spacing.$unit-fourth spacing.$unit-half;
		border-radius: layout.$item-corner;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		flex-shrink: 0;

		&.action-keep {
			background: var(--wind-nav-selected-bg);
			color: var(--wind-nav-selected-text);
		}
		&.action-reroll {
			background: var(--notice-bg);
			color: var(--notice-text);
		}
		&.action-scrap {
			background: var(--danger-bg);
			color: var(--danger);
		}
	}

	.reason {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.no-grade {
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
	}

	.no-grade-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-style: italic;
	}

	// Size variants
	.size-small {
		.grade-letter {
			font-size: 1.25rem;
			padding: spacing.$unit-fourth spacing.$unit-half;
		}
		.grade-score {
			font-size: typography.$font-regular;
		}
	}

	.size-large {
		.grade-letter {
			font-size: 3rem;
			padding: spacing.$unit spacing.$unit-2x;
		}
		.grade-score {
			font-size: typography.$font-xlarge;
		}
	}
</style>
