
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { localizedName } from '$lib/utils/locale'
	import { getCharacterImage, getCharacterPose } from '$lib/utils/images'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		userId: string
		element: number
		proficiency: number
	}

	let { userId, element, proficiency }: Props = $props()

	// Query collection characters filtered by element AND proficiency
	const filters = $derived({
		element: [element],
		proficiency: [proficiency]
	})

	const query = createQuery(() =>
		collectionQueries.charactersList(userId, filters, !!userId && !!element && !!proficiency)
	)

	const characters = $derived(query.data ?? [])
	const isLoading = $derived(query.isLoading)
	const isEmpty = $derived(!isLoading && characters.length === 0)

	// Get character display name
	function getDisplayName(character: (typeof characters)[number]): string {
		return localizedName(character.character.name)
	}

	// Get character image with pose
	function getImage(character: (typeof characters)[number]): string {
		const pose = getCharacterPose(character.uncapLevel, character.transcendenceStep)
		return getCharacterImage(character.character.granblueId, 'square', pose)
	}
</script>

<DetailsSection title="Equippable Characters">
	{#if isLoading}
		<div class="loading-state">
			<Icon name="loader-2" size={20} />
		</div>
	{:else if isEmpty}
		<div class="empty-state">
			<span class="empty-text">No matching characters in collection</span>
		</div>
	{:else}
		<div class="character-grid">
			{#each characters as character (character.id)}
				<RichTooltip>
					{#snippet content()}
						<div class="tooltip-content">
							<span class="character-name">{getDisplayName(character)}</span>
							<CharacterTags character={character.character} />
						</div>
					{/snippet}
					{#snippet children()}
						<div class="character-portrait">
							<img
								src={getImage(character)}
								alt={getDisplayName(character)}
								loading="lazy"
							/>
						</div>
					{/snippet}
				</RichTooltip>
			{/each}
		</div>
	{/if}
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.loading-state {
		display: flex;
		justify-content: center;
		padding: $unit $unit-2x;

		:global(svg) {
			animation: spin 1s linear infinite;
			color: var(--text-secondary);
		}
	}

	.empty-state {
		padding: 0 $unit;
	}

	.empty-text {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.character-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: $unit;
		padding: 0 $unit;
	}

	.character-portrait {
		aspect-ratio: 1 / 1;
		border-radius: $item-corner-small;
		overflow: hidden;
		cursor: pointer;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		&:hover {
			box-shadow: 0 0 0 2px var(--accent-color);
		}
	}

	.tooltip-content {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.character-name {
		font-weight: $medium;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
