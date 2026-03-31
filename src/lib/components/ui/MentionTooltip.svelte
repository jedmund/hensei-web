<script lang="ts">
	import { getBasePath } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'

	interface MentionEntity {
		granblue_id: string
		name: { en: string; ja: string }
		type: string
		element: { id: number; [key: string]: unknown }
		proficiency?: number | number[]
		season?: number | null
		series?: number[] | { id: string; slug: string; name: { en: string; ja: string } }[] | null
		styleSwap?: boolean
	}

	interface Props {
		entity: MentionEntity
		visible: boolean
	}

	let { entity, visible }: Props = $props()

	const imageUrl = $derived.by(() => {
		const base = getBasePath()
		if (entity.type === 'character') {
			return `${base}/character-square/${entity.granblue_id}_01.jpg`
		}
		return `${base}/${entity.type}-square/${entity.granblue_id}.jpg`
	})

	const proficiencies = $derived.by(() => {
		if (entity.proficiency === undefined || entity.proficiency === null) return []
		if (Array.isArray(entity.proficiency)) return entity.proficiency.filter((p) => p > 0)
		return entity.proficiency > 0 ? [entity.proficiency] : []
	})

	const isCharacter = $derived(entity.type === 'character')
	const hasProficiencies = $derived(proficiencies.length > 0)
</script>

{#if visible}
	<div class="mention-tooltip">
		<img class="entity-image" src={imageUrl} alt="" loading="lazy" />
		<div class="entity-info">
			<span class="entity-name">{localizedName(entity.name)}</span>
			{#if isCharacter}
				<CharacterTags
					character={{
						element: entity.element.id,
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

	.entity-image {
		width: 60px;
		height: 60px;
		border-radius: $item-corner-small;
		object-fit: cover;
		flex-shrink: 0;
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

	.proficiencies {
		display: flex;
		gap: $unit-half;

		:global(.proficiency-label) {
			height: 23px;
		}
	}
</style>
