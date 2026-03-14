
<script lang="ts">
	import type { GridArtifact, CollectionArtifact } from '$lib/types/api/artifact'
	import { getArtifactImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		artifact: GridArtifact | CollectionArtifact
		compact?: boolean
	}

	let { artifact, compact = false }: Props = $props()

	const imageUrl = $derived(getArtifactImage(artifact.artifact?.granblueId))

	const displayName = $derived(localizedName(artifact.artifact?.name))

	// Is quirk artifact?
	const isQuirk = $derived(artifact.artifact?.rarity === 'quirk')

	// Proficiency
	const proficiency = $derived(
		(isQuirk ? artifact.proficiency : artifact.artifact?.proficiency) ?? undefined
	)

	// Score
	const totalScore = $derived(artifact.score?.total ?? null)

	function scoreColor(total: number): string {
		if (total >= 16) return 'var(--score-high, #ffd700)'
		if (total >= 12) return 'var(--score-good, #4ade80)'
		if (total >= 8) return 'var(--score-mid, inherit)'
		if (total >= 4) return 'var(--score-low, #f87171)'
		return 'var(--score-none, var(--text-tertiary))'
	}

	// Skills count
	const skillCount = $derived(artifact.skills?.filter((s) => s !== null).length ?? 0)
</script>

{#if compact}
	<div class="artifact-summary compact">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} />
		</div>
		<div class="info">
			<span class="name">{displayName}</span>
			<div class="meta">
				<ElementLabel element={artifact.element} size="small" />
				{#if totalScore !== null}
					<span class="score-value" style:color={scoreColor(totalScore)}>{totalScore}</span>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="artifact-summary detailed">
		<div class="header">
			<div class="thumbnail">
				<img src={imageUrl} alt={displayName} />
			</div>
			<div class="header-info">
				<span class="name">{displayName}</span>
				<span class="level">{m.details_artifact_level({ level: String(artifact.level) })}</span>
			</div>
		</div>

		<div class="stats">
			<div class="stat">
				<span class="stat-label">{m.details_element()}</span>
				<ElementLabel element={artifact.element} size="small" />
			</div>
			<div class="stat">
				<span class="stat-label">{m.details_proficiency()}</span>
				<ProficiencyLabel {proficiency} size="small" />
			</div>
			{#if !isQuirk}
				<div class="stat">
					<span class="stat-label">{m.details_skills()}</span>
					<span class="stat-value">{skillCount}/4</span>
				</div>
			{:else}
				<div class="stat">
					<span class="stat-label">{m.details_artifact_type()}</span>
					<span class="quirk-badge">{m.details_artifact_quirk()}</span>
				</div>
			{/if}
			{#if totalScore !== null}
				<div class="stat">
					<span class="stat-label">{m.details_artifact_score()}</span>
					<span class="score-value" style:color={scoreColor(totalScore)}>{totalScore}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.artifact-summary {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.thumbnail {
		width: 48px;
		height: 48px;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	// Compact layout
	.compact {
		flex-direction: row;
		align-items: center;
		gap: $unit-2x;

		.thumbnail {
			width: 36px;
			height: 36px;
		}

		.info {
			display: flex;
			flex-direction: column;
			gap: $unit-fourth;

			.name {
				font-size: $font-small;
				font-weight: $medium;
				color: var(--text-primary);
			}

			.meta {
				display: flex;
				align-items: center;
				gap: $unit-half;
			}
		}
	}

	// Detailed layout
	.detailed {
		.header {
			display: flex;
			align-items: center;
			gap: $unit-2x;
		}

		.header-info {
			display: flex;
			flex-direction: column;
			gap: $unit-fourth;

			.name {
				font-size: $font-regular;
				font-weight: $medium;
				color: var(--text-primary);
			}

			.level {
				font-size: $font-small;
				color: var(--text-secondary);
			}
		}

		.stats {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: $unit;
			margin-top: $unit;
		}

		.stat {
			display: flex;
			flex-direction: column;
			gap: $unit-fourth;

			.stat-label {
				font-size: $font-tiny;
				color: var(--text-tertiary);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}

			.stat-value {
				font-size: $font-small;
				color: var(--text-primary);
			}
		}
	}

	.score-value {
		font-size: $font-tiny;
		font-weight: $bold;
		line-height: 1;
	}

	// Quirk badge
	.quirk-badge {
		font-size: $font-tiny;
		font-weight: $medium;
		padding: 2px 6px;
		border-radius: $item-corner-small;
		background: var(--purple-50, #b6b2fc);
		color: var(--purple-10, #4f3c79);
	}
</style>
