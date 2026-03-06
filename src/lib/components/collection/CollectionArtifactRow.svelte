<svelte:options runes={true} />

<script lang="ts">
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { getArtifactImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'

	interface Props {
		artifact: CollectionArtifact
		onClick?: () => void
	}

	let { artifact, onClick }: Props = $props()

	const imageUrl = $derived(getArtifactImage(artifact.artifact?.granblueId))

	const displayName = $derived.by(() => {
		const name = artifact.artifact?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})

	// Get grade display
	const gradeLetter = $derived(artifact.grade?.letter)
	const gradeClass = $derived(gradeLetter?.toLowerCase() ?? 'none')

	// Is this a quirk artifact?
	const isQuirk = $derived(artifact.artifact?.rarity === 'quirk')

	// Proficiency - from artifact for standard, from instance for quirk
	const proficiency = $derived(
		(isQuirk ? artifact.proficiency : artifact.artifact?.proficiency) ?? undefined
	)

	// Skills summary (count of non-null skills)
	const skillCount = $derived(
		artifact.skills?.filter((s) => s !== null).length ?? 0
	)
</script>

<button type="button" class="artifact-row" onclick={onClick}>
	<div class="core-info">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} loading="lazy" />
		</div>

		<div class="name-cell">
			<span class="name">{displayName}</span>
			{#if artifact.nickname}
				<span class="nickname">"{artifact.nickname}"</span>
			{/if}
		</div>
	</div>

	<div class="element-cell">
		<ElementLabel element={artifact.element} size="medium" />
	</div>

	<div class="proficiency-cell">
		<ProficiencyLabel {proficiency} size="medium" />
	</div>

	<div class="level-cell">
		<span class="level">Lv.{artifact.level}</span>
	</div>

	<div class="skills-cell">
		{#if isQuirk}
			<span class="quirk-badge">Quirk</span>
		{:else if skillCount > 0}
			<span class="skills">{skillCount}/4 skills</span>
		{:else}
			<span class="placeholder">—</span>
		{/if}
	</div>

	<div class="grade-cell">
		{#if gradeLetter}
			<span class="grade-badge grade-{gradeClass}">{gradeLetter}</span>
		{:else}
			<span class="placeholder">—</span>
		{/if}
	</div>
</button>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as colors;

	.artifact-row {
		display: flex;
		align-items: center;
		gap: $unit-4x;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: var(--list-cell-bg);
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: $card-corner;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
			box-shadow: var(--shadow-md);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: -2px;
		}
	}

	.core-info {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		flex-grow: 1;

		.thumbnail {
			width: 64px;
			aspect-ratio: 1 / 1;
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

		.name-cell {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: $unit-fourth;

			.name {
				font-size: $font-regular;
				font-weight: $medium;
				color: var(--text-primary);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.nickname {
				font-size: $font-small;
				color: var(--text-secondary);
				font-style: italic;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	.element-cell,
	.proficiency-cell {
		flex-shrink: 0;
	}

	.level-cell {
		width: 48px;
		flex-shrink: 0;

		.level {
			font-size: $font-small;
			color: var(--text-secondary);
			font-weight: $medium;
		}
	}

	.skills-cell {
		width: 80px;
		display: flex;
		justify-content: flex-start;
		flex-shrink: 0;

		.skills {
			font-size: $font-small;
			color: var(--text-secondary);
		}

		.quirk-badge {
			font-size: $font-small;
			font-weight: $medium;
			padding: 2px 6px;
			border-radius: 4px;
			background: var(--purple-50, #b6b2fc);
			color: var(--purple-10, #4f3c79);
		}
	}

	.grade-cell {
		width: 40px;
		display: flex;
		justify-content: center;
		flex-shrink: 0;
	}

	.grade-badge {
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 8px;
		border-radius: 4px;
		line-height: 1;

		&.grade-s {
			background: linear-gradient(135deg, colors.$gold, colors.$gold-light);
			color: #6b4c00;
		}
		&.grade-a {
			background: linear-gradient(135deg, #4ade80, #22c55e);
			color: #14532d;
		}
		&.grade-b {
			background: linear-gradient(135deg, #60a5fa, #3b82f6);
			color: #1e3a5f;
		}
		&.grade-c,
		&.grade-d {
			background: var(--grey-80, #e9e9e9);
			color: var(--grey-40, #444);
		}
		&.grade-f {
			background: linear-gradient(135deg, #f87171, #ef4444);
			color: #7f1d1d;
		}
	}

	.placeholder {
		color: var(--text-tertiary);
	}
</style>
