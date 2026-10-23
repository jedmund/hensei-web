<script lang="ts">
	import type { Substitution } from '$lib/types/api/party'
	import {
		type GridItemType,
		getSubstituteName,
		getSubstituteImage,
		getSubstituteElement,
		getSubstituteProficiencies,
		isFromCollection,
		getSubstituteFallbackImage
	} from './substitutionHelpers'
	import { handleImageFallback } from '$lib/utils/images'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CollectionBadge from '$lib/components/CollectionBadge.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		substitution: Substitution
		type: GridItemType
		index: number
		isDropTarget: boolean
		onDragStart: (e: DragEvent, index: number) => void
		onDragOver: (e: DragEvent, index: number) => void
		onDragLeave: () => void
		onDrop: (e: DragEvent, index: number) => void
		onDelete: (sub: Substitution) => void
	}

	let {
		substitution,
		type,
		index,
		isDropTarget,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onDelete
	}: Props = $props()

	const character = $derived(substitution.gridCharacter?.character)
	const element = $derived(getSubstituteElement(substitution))
	const proficiencies = $derived(getSubstituteProficiencies(substitution))
	const fromCollection = $derived(isFromCollection(substitution))
</script>

<li
	class="substitution-item"
	class:drop-target={isDropTarget}
	draggable="true"
	ondragstart={(e) => onDragStart(e, index)}
	ondragover={(e) => onDragOver(e, index)}
	ondragleave={onDragLeave}
	ondrop={(e) => onDrop(e, index)}
>
	<div class="thumb-wrapper">
		<img
			src={getSubstituteImage(substitution, type)}
			alt=""
			class="thumb"
			loading="lazy"
			onerror={(e) => handleImageFallback(e, getSubstituteFallbackImage(substitution))}
		/>
		{#if fromCollection}
			<CollectionBadge />
		{/if}
	</div>
	<div class="info">
		<span class="name">{getSubstituteName(substitution)}</span>
		{#if element !== undefined || proficiencies.length > 0}
			<div class="labels">
				{#if element !== undefined}
					<ElementLabel {element} size="small" />
				{/if}
				{#each proficiencies as prof (prof)}
					<ProficiencyLabel proficiency={prof} size="small" />
				{/each}
			</div>
		{/if}
	</div>
	{#if character}
		<CharacterTags {character} />
	{/if}
	<button
		class="action-btn delete"
		onclick={() => onDelete(substitution)}
		title={m.substitution_remove()}
	>
		<Icon name="close" size={14} />
	</button>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.substitution-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		font-size: typography.$font-regular;
		padding: spacing.$unit;
		border-radius: spacing.$unit;
		cursor: grab;
		transition:
			background 0.15s ease,
			outline-color 0.15s ease;
		outline: 2px solid transparent;

		&:hover {
			background: var(--list-cell-bg-hover);
		}

		&:active {
			cursor: grabbing;
		}

		&.drop-target {
			outline-color: var(--accent-blue);
		}
	}

	.thumb-wrapper {
		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.thumb {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-primary);
		background: var(--placeholder-bg);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
		font-size: typography.$font-regular;
	}

	.labels {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: layout.$item-corner-small;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background 0.15s ease;

		&:hover:not(:disabled) {
			color: var(--text-primary);
			background: var(--input-bound-bg-hover);
		}

		&.delete:hover:not(:disabled) {
			color: var(--red);
		}
	}
</style>
