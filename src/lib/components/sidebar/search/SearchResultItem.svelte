
<script lang="ts">
	import Icon from '../../Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
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
		inTeam?: boolean
		onclick?: (item: AddItemResult) => void
	}

	let {
		item,
		type,
		disabled = false,
		fromCollection = false,
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
				return getWeaponImage(id, 'square', result.element === 0 ? 0 : undefined)
			case 'summon':
				return getSummonImage(id, 'square')
			default:
				return ''
		}
	}

	function getItemName(result: AddItemResult): string {
		const name = result.name
		if (typeof name === 'string') return name
		return localizedName(name) || 'Unknown'
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
		class:in-team={inTeam}
		onclick={() => onclick?.(item)}
		aria-label={inTeam ? m.search_already_in_team() : isDisabled ? m.search_grid_full() : m.search_add_item({ name: itemName })}
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
					<span class="in-team-pill">{m.search_added_pill()}</span>
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
		{/if}
	</button>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.result-item {
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
				background: var(--list-cell-bg-hover);
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

		}

		.result-image {
			width: 48px;
			height: 48px;
			object-fit: cover;
			border-radius: $item-corner-small;
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

	}
</style>
