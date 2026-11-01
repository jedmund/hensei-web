<script lang="ts">
	// The other units sharing the character's character ID (e.g. a unit's solo
	// versions), as a titled section that shows only once some load
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { characterAdapter, type Character } from '$lib/api/adapters/character.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'

	let { record }: { record: Character } = $props()

	const relatedQuery = createQuery(() => ({
		queryKey: ['characters', 'related', record.id],
		queryFn: () => characterAdapter.getRelatedCharacters(record.id),
		enabled: !!record.id && !!record.characterId?.length
	}))
</script>

{#if relatedQuery.data?.length}
	<DetailsContainer title={m.db_characters_section_related()}>
		<div class="related-units">
			{#each relatedQuery.data as related (related.id)}
				<a
					href={localizeHref(
						`/database/characters/${related.granblueId}${related.styleSwap ? '/style' : ''}`
					)}
					class="related-unit"
				>
					<img
						src={getCharacterImage(
							related.granblueId,
							'grid',
							related.styleSwap ? '01_style' : '01'
						)}
						alt={localizedName(related.name)}
						class="related-image"
					/>
					<span class="related-name">{localizedName(related.name)}</span>
					<CharacterTags character={related} />
				</a>
			{/each}
		</div>
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.related-units {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x 0;
	}

	.related-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-half;
		text-decoration: none;
		color: var(--text-primary);

		&:hover .related-image {
			transform: scale(1.05);
		}
	}

	.related-image {
		width: 128px;
		height: auto;
		border-radius: layout.$item-corner;
		transition: transform 0.2s ease;
	}

	.related-name {
		margin-top: spacing.$unit;
		font-size: typography.$font-small;
		text-align: center;
	}
</style>
