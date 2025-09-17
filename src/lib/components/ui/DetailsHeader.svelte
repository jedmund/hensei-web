<svelte:options runes={true} />

<script lang="ts">
	// Utility functions
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import { getProficiencyLabel, getProficiencyIcon } from '$lib/utils/proficiency'

	// Components
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'

	// Props
	interface Props {
		type: 'character' | 'summon' | 'weapon'
		item: any // The character/summon/weapon object
		image: string
	}

	let { type, item, image }: Props = $props()

	// Extract commonly used fields
	const name = $derived(item?.name)
	const element = $derived(item?.element)
	const proficiency = $derived(item?.proficiency)
	const maxLevel = $derived(item?.max_level)
	const granblueId = $derived(item?.granblue_id)

	// Helper function to get display name
	function getDisplayName(nameObj: string | { en?: string; ja?: string }): string {
		if (!nameObj) return 'Unknown'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown'
	}
</script>

<section class="container">
	<div class="info">
		<h2>{getDisplayName(name)}</h2>
		<div class="meta">
			{#if element !== undefined}
				<ElementLabel {element} size="medium" />
			{/if}
			{#if (type === 'character' || type === 'weapon') && proficiency}
				{#if Array.isArray(proficiency)}
					{#if proficiency[0] !== undefined}
						<ProficiencyLabel proficiency={proficiency[0]} size="medium" />
					{/if}
					{#if proficiency[1] !== undefined}
						<ProficiencyLabel proficiency={proficiency[1]} size="medium" />
					{/if}
				{:else if proficiency !== undefined}
					<ProficiencyLabel {proficiency} size="medium" />
				{/if}
			{/if}
		</div>
	</div>

	<div class="image">
		<img
			src={image}
			alt={getDisplayName(name)}
			onerror={(e) => {
				const placeholder =
					type === 'character'
						? '/images/placeholders/placeholder-character-main.png'
						: type === 'summon'
							? '/images/placeholders/placeholder-summon-main.png'
							: '/images/placeholders/placeholder-weapon-main.png'
				;(e.currentTarget as HTMLImageElement).src = placeholder
			}}
		/>
	</div>
</section>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;

		.image {
			flex-shrink: 0;

			img {
				width: 128px;
				height: auto;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
		}

		.info {
			flex: 1;

			h2 {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: colors.$grey-30;
			}

			.meta {
				display: flex;
				flex-direction: row;
				gap: spacing.$unit;
			}
		}
	}

	@media (max-width: 768px) {
		.details-hero {
			flex-direction: column;

			.details-image img {
				width: 150px;
			}
		}
	}
</style>
