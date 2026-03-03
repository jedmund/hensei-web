<svelte:options runes={true} />

<script lang="ts">
	import Icon from '../../Icon.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import {
		getCharacterImage,
		getWeaponImage,
		getSummonImage,
		getPlaceholder
	} from '$lib/features/database/detail/image'
	import type { AddItemResult } from '$lib/types/api/search'

	interface Props {
		item: AddItemResult
		type: 'weapon' | 'character' | 'summon'
		disabled?: boolean
		fromCollection?: boolean
		owned?: boolean
		inTeam?: boolean
		onclick?: (item: AddItemResult) => void
	}

	let {
		item,
		type,
		disabled = false,
		fromCollection = false,
		owned = false,
		inTeam = false,
		onclick
	}: Props = $props()

	function getImageUrl(result: AddItemResult): string {
		const id = result.granblueId
		if (!id) return getPlaceholder(type, 'square')

		switch (type) {
			case 'character':
				return getCharacterImage(id, 'square', '01')
			case 'weapon':
				return getWeaponImage(id, 'square')
			case 'summon':
				return getSummonImage(id, 'square')
			default:
				return ''
		}
	}

	function getItemName(result: AddItemResult): string {
		const name = result.name
		if (typeof name === 'string') return name
		return name?.en || name?.ja || 'Unknown'
	}

	const itemName = $derived(getItemName(item))
	const imageUrl = $derived(getImageUrl(item))
	const isDisabled = $derived(disabled || inTeam)
</script>

<li class="result-item">
	<button
		class="result-button"
		class:disabled={isDisabled}
		class:from-collection={fromCollection}
		class:owned
		class:in-team={inTeam}
		onclick={() => onclick?.(item)}
		aria-label="{inTeam ? 'Already in team' : isDisabled ? 'Grid full - cannot add' : 'Add'} {itemName}"
		disabled={isDisabled}
	>
		<img src={imageUrl} alt={itemName} class="result-image" loading="lazy" />
		<div class="result-info">
			<span class="result-name">{itemName}</span>
			<div class="result-labels">
				{#if item.element !== undefined}
					<ElementLabel element={item.element} size="small" />
				{/if}
				{#if inTeam}
					<span class="in-team-pill">Added to team</span>
				{/if}
				{#if Array.isArray(item.proficiency)}
					{#each item.proficiency as prof}
						<ProficiencyLabel proficiency={prof} size="small" />
					{/each}
				{:else if item.proficiency !== undefined}
					<ProficiencyLabel proficiency={item.proficiency} size="small" />
				{/if}
			</div>
		</div>
		{#if type === 'character'}
			<CharacterTags character={item} />
		{/if}
		{#if fromCollection && !inTeam}
			<Icon name="bookmark" size={14} class="collection-indicator" />
		{:else if owned}
			<Icon name="check" size={14} class="owned-indicator" />
		{/if}
	</button>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.result-item {
		margin-bottom: $unit-half;

		.result-button {
			width: 100%;
			display: flex;
			align-items: center;
			gap: $unit;
			padding: $unit;
			border: none;
			border-radius: $input-corner;
			background: transparent;
			cursor: pointer;
			transition: background-color 0.15s ease-out;
			text-align: left;

			&:hover {
				background: var(--bg-tertiary);
			}

			&:active:not(:disabled) {
				transform: scale(0.99);
			}

			&.disabled:not(.in-team),
			&:disabled:not(.in-team) {
				opacity: 0.5;
				cursor: not-allowed;

				&:hover {
					background: transparent;
				}
			}

			&.in-team {
				cursor: not-allowed;

				.result-image,
				.result-name,
				:global(.element-label),
				:global(.proficiency-label),
				:global(.character-tags) {
					opacity: 0.45;
				}

				&:hover {
					background: transparent;
				}
			}

			&.owned {
				background: var(--owned-bg, rgba(76, 175, 80, 0.08));

				&:hover {
					background: var(--owned-bg-hover, rgba(76, 175, 80, 0.15));
				}
			}
		}

		.result-image {
			width: 48px;
			height: 48px;
			object-fit: cover;
			border-radius: 4px;
			border: 1px solid var(--border-primary);
			flex-shrink: 0;
		}

		.result-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: $unit-half;
			min-width: 0;
		}

		.result-name {
			font-size: $font-regular;
			color: var(--text-primary);
		}

		.result-labels {
			display: flex;
			align-items: center;
			gap: $unit-half;
		}

		.in-team-pill {
			display: inline-flex;
			align-items: center;
			padding: 1px $unit-half;
			border-radius: $unit-half;
			background: var(--bg-tertiary);
			color: var(--text-tertiary);
			font-size: $font-tiny;
			font-weight: $medium;
			white-space: nowrap;
		}

		:global(.collection-indicator) {
			color: var(--accent-blue);
			flex-shrink: 0;
		}

		:global(.owned-indicator) {
			color: var(--success, #4caf50);
			flex-shrink: 0;
			opacity: 0.7;
		}
	}
</style>
