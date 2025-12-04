<svelte:options runes={true} />

<script lang="ts">
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { getArtifactImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'

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

	// Get grade letter for badge
	const gradeLetter = $derived(artifact.grade?.letter)
	const gradeClass = $derived(gradeLetter?.toLowerCase() ?? 'none')

	// Is this a quirk artifact?
	const isQuirk = $derived(artifact.artifact?.rarity === 'quirk')
</script>

<button type="button" class="artifact-card" onclick={onClick}>
	<div class="card-image">
		<img class="artifact-image" src={imageUrl} alt={displayName} loading="lazy" />
		{#if gradeLetter}
			<span class="grade-badge grade-{gradeClass}">{gradeLetter}</span>
		{/if}
		{#if isQuirk}
			<span class="quirk-badge">Q</span>
		{/if}
	</div>
	<div class="card-info">
		<ElementLabel element={artifact.element} size="small" />
		<span class="level">Lv.{artifact.level}</span>
	</div>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.artifact-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: 2px;
			border-radius: $item-corner;
		}
	}

	.card-image {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.artifact-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: $item-corner;
	}

	.grade-badge {
		position: absolute;
		top: $unit-fourth;
		right: $unit-fourth;
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1;

		&.grade-s {
			background: linear-gradient(135deg, #ffd700, #ffb347);
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

	.quirk-badge {
		position: absolute;
		top: $unit-fourth;
		left: $unit-fourth;
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1;
		background: var(--purple-50, #b6b2fc);
		color: var(--purple-10, #4f3c79);
	}

	.card-info {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.level {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
