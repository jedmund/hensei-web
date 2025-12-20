<svelte:options runes={true} />

<script lang="ts">
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/utils/images'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import type { UnifiedSearchSeriesRef } from '$lib/api/adapters/search.adapter'

	type ItemType = 'Character' | 'Weapon' | 'Summon'

	interface Props {
		/** Display label/name */
		label: string
		/** Granblue ID for image lookup */
		granblueId: string
		/** Type of item */
		type: ItemType
		/** Element (for character tags) */
		element?: number
		/** Season (for character tags) */
		season?: number | null
		/** Series (for character tags) */
		series?: UnifiedSearchSeriesRef[] | null
		/** Whether to show the type label */
		showType?: boolean
	}

	let {
		label,
		granblueId,
		type,
		element,
		season,
		series,
		showType = true
	}: Props = $props()

	function getImage(): string {
		switch (type) {
			case 'Character':
				return getCharacterImage(granblueId, 'square', '01')
			case 'Weapon':
				return getWeaponImage(granblueId, 'square')
			case 'Summon':
				return getSummonImage(granblueId, 'square')
		}
	}
</script>

<div class="option-item">
	<img src={getImage()} alt="" class="option-image" />
	<div class="option-info">
		<span class="option-label">{label}</span>
		{#if type === 'Character'}
			<CharacterTags character={{ element, season, series }} />
		{/if}
	</div>
	{#if showType}
		<span class="option-type">{type}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		width: 100%;
	}

	.option-image {
		width: 48px;
		height: 48px;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.option-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
		min-width: 0;
	}

	.option-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option-type {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
</style>
