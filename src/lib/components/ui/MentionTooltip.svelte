<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import {
		descriptorFor,
		mentionImageUrl,
		skillDescriptionLines,
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
	const isSkill = $derived(secondary === 'skill-meta')

	const proficiencies = $derived.by(() => {
		if (entity.proficiency === undefined || entity.proficiency === null) return []
		if (Array.isArray(entity.proficiency)) return entity.proficiency.filter((p) => p > 0)
		return entity.proficiency > 0 ? [entity.proficiency] : []
	})

	const skillDescription = $derived(entity.skill ? localizedName(entity.skill.description) : '')
	const descriptionLines = $derived(
		skillDescription && skillDescription !== '—' ? skillDescriptionLines(skillDescription) : []
	)
	const hasProficiencies = $derived(proficiencies.length > 0)
</script>

{#snippet thumbnail()}
	<div class="entity-image {entity.type}">
		{#if imageUrl}
			<img src={imageUrl} alt="" loading="lazy" />
		{:else}
			<span class="entity-swatch" style:background={swatchColor ?? 'var(--border-color)'}></span>
		{/if}
	</div>
{/snippet}

{#if visible}
	{#if isSkill}
		<div class="mention-tooltip skill-tooltip">
			<div class="skill-lockup">
				{@render thumbnail()}
				<div class="skill-headings">
					<span class="entity-name">{localizedName(entity.name)}</span>
					{#if entity.skill?.character}
						<span class="skill-owner">{skillMentionSubheader(entity)}</span>
					{/if}
				</div>
			</div>
			{#if descriptionLines.length > 0}
				<div class="skill-description">
					{#each descriptionLines as line, i (i)}
						<p>{line}</p>
					{/each}
				</div>
			{/if}
			{#if entity.skill?.cooldown != null}
				<div class="skill-stat">{m.mention_skill_cooldown({ n: entity.skill.cooldown })}</div>
			{/if}
			{#if entity.skill?.initialCooldown}
				<div class="skill-stat">
					{m.mention_skill_available_in({ n: entity.skill.initialCooldown })}
				</div>
			{/if}
		</div>
	{:else}
		<div class="mention-tooltip">
			{@render thumbnail()}
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
	}

	// Skills stack a name/owner lockup over a full-width description + timing lines.
	.skill-tooltip {
		flex-direction: column;
		gap: $unit-half;
		max-width: 280px;
	}

	.skill-lockup {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: $unit;
		width: 100%;
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

	// Slightly smaller icon in the skill lockup.
	.skill-lockup .entity-image {
		width: 44px;
		height: 44px;
	}

	.entity-swatch {
		display: block;
		width: 100%;
		height: 100%;
	}

	.entity-info,
	.skill-headings {
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

	// Skill names can be long; let them wrap within the lockup instead of clipping.
	.skill-headings .entity-name {
		white-space: normal;
	}

	.skill-owner {
		font-size: $font-small;
		color: var(--tooltip-text, white);
		opacity: 0.7;
	}

	.skill-description {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		font-size: $font-small;
		line-height: 1.4;
		opacity: 0.9;

		p {
			margin: 0;
			white-space: normal;
		}
	}

	.skill-stat {
		font-size: $font-small;
		opacity: 0.7;
	}

	.proficiencies {
		display: flex;
		gap: $unit-half;

		:global(.proficiency-label) {
			height: 23px;
		}
	}
</style>
