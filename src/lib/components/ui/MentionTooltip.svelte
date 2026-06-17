<script lang="ts">
	import { localizedName } from '$lib/utils/locale'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import {
		descriptorFor,
		mentionImageUrl,
		skillMentionSubheader,
		typeColorSwatch
	} from '$lib/components/edra/extensions/entity-mention/mentions/index.js'
	import type { MentionToken } from '$lib/components/edra/extensions/entity-mention/mentions/index.js'

	interface Props {
		entity: MentionToken
		visible: boolean
	}

	let { entity, visible }: Props = $props()

	const imageUrl = $derived(mentionImageUrl(entity))
	const swatchColor = $derived(typeColorSwatch(entity.skill?.typeColor))
	const secondary = $derived(descriptorFor(entity.type).secondary)

	const proficiencies = $derived.by(() => {
		if (entity.proficiency === undefined || entity.proficiency === null) return []
		if (Array.isArray(entity.proficiency)) return entity.proficiency.filter((p) => p > 0)
		return entity.proficiency > 0 ? [entity.proficiency] : []
	})

	const skillDescription = $derived(entity.skill ? localizedName(entity.skill.description) : '')
	const hasProficiencies = $derived(proficiencies.length > 0)
</script>

{#if visible}
	<div class="mention-tooltip" class:is-skill={secondary === 'skill-meta'}>
		<div class="entity-image {entity.type}">
			{#if imageUrl}
				<img src={imageUrl} alt="" loading="lazy" />
			{:else}
				<span class="entity-swatch" style:background={swatchColor ?? 'var(--border-color)'}></span>
			{/if}
		</div>
		<div class="entity-info">
			<span class="entity-name">{localizedName(entity.name)}</span>
			{#if secondary === 'character-tags'}
				<CharacterTags
					character={{
						element: entity.element?.id,
						season: entity.season,
						series: entity.series,
						styleSwap: entity.styleSwap
					}}
				/>
			{:else if secondary === 'skill-meta'}
				{#if entity.skill?.character}
					<span class="skill-owner">{skillMentionSubheader(entity)}</span>
				{/if}
				{#if skillDescription && skillDescription !== '—'}
					<p class="skill-description">{skillDescription}</p>
				{/if}
			{/if}
			{#if hasProficiencies}
				<div class="proficiencies">
					{#each proficiencies as prof (prof)}
						<ProficiencyLabel proficiency={prof} size="small" />
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;

	.mention-tooltip {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: $unit;
		background: var(--tooltip-bg, #2a2a2a);
		color: var(--tooltip-text, white);
		padding: $unit;
		border-radius: $item-corner;
		z-index: effects.$z-notification;
		box-shadow: var(--shadow-md);

		&.is-skill {
			max-width: 280px;
		}
	}

	.entity-image {
		width: 60px;
		height: 60px;
		border-radius: $item-corner-small;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		// Skill icons are transparent PNGs; show them whole.
		&.skill img {
			object-fit: contain;
		}
	}

	.entity-swatch {
		display: block;
		width: 100%;
		height: 100%;
	}

	.entity-info {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.entity-name {
		font-size: $font-regular;
		font-weight: $medium;
		white-space: nowrap;
	}

	.skill-owner {
		font-size: $font-small;
		color: var(--tooltip-text, white);
		opacity: 0.7;
	}

	.skill-description {
		margin: 0;
		font-size: $font-small;
		line-height: 1.4;
		white-space: normal;
		opacity: 0.9;
	}

	.proficiencies {
		display: flex;
		gap: $unit-half;

		:global(.proficiency-label) {
			height: 23px;
		}
	}
</style>
