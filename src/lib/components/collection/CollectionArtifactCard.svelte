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

	// Is this a quirk artifact?
	const isQuirk = $derived(artifact.artifact?.rarity === 'quirk')

	// Proficiency: quirk artifacts use instance proficiency, standard use canonical
	const proficiency = $derived(artifact.proficiency ?? artifact.artifact?.proficiency)
</script>

<button type="button" class="artifact-card" onclick={onClick}>
	<div class="card-image">
		<img class="artifact-image" src={imageUrl} alt={displayName} loading="lazy" />
		<span class="level-badge">Lv.{artifact.level}</span>
		{#if isQuirk}
			<span class="quirk-badge">Q</span>
		{/if}
	</div>
	{#if artifact.nickname}
		<span class="artifact-name nickname">{artifact.nickname}</span>
	{:else}
		<span class="artifact-name">{displayName}</span>
	{/if}
	<div class="card-info">
		<ElementLabel element={artifact.element} size="small" />
		<ProficiencyLabel {proficiency} size="small" />
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
		display: flex;
		justify-content: center;
		position: relative;
		width: 100%;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.artifact-image {
		width: 104px;
		height: 104px;
		object-fit: contain;
		border-radius: $item-corner;
	}

	.level-badge {
		position: absolute;
		top: $unit-fourth;
		right: $unit-fourth;
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 6px;
		border-radius: $item-corner-small;
		line-height: 1;
		background: var(--grey-80, #e9e9e9);
		color: var(--grey-40, #444);
	}

	.quirk-badge {
		position: absolute;
		top: $unit-fourth;
		left: $unit-fourth;
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 6px;
		border-radius: $item-corner-small;
		line-height: 1;
		background: var(--purple-50, #b6b2fc);
		color: var(--purple-10, #4f3c79);
	}

	.card-info {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.artifact-name {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: $font-small;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: normal;
		word-break: break-word;
		max-width: 139px;
		min-height: calc($font-small * 1.4 * 2);

		&.nickname {
			font-weight: $bold;
		}
	}
</style>
