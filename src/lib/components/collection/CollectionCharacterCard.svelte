<script lang="ts">
	import type { CollectionCharacter } from '$lib/types/api/collection'
	import { localizedName } from '$lib/utils/locale'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'

	interface Props {
		character: CollectionCharacter
		onClick?: () => void
	}

	let { character, onClick }: Props = $props()

	const imageUrl = $derived(
		getCharacterImageWithPose(
			character.character?.granblueId,
			'grid',
			character.uncapLevel,
			character.transcendenceStep,
			null,
			null,
			character.character?.styleSwap
		)
	)

	const displayName = $derived(localizedName(character.character?.name))
</script>

<button type="button" class="character-card" onclick={onClick}>
	<div class="card-image">
		{#if character.perpetuity}
			<img
				class="perpetuity-badge"
				src={perpetuityFilled}
				alt="Perpetuity Ring"
				title="Perpetuity Ring"
			/>
		{/if}
		<img class="character-image" src={imageUrl} alt={displayName} loading="lazy" />
	</div>
	<UncapIndicator
		type="character"
		uncapLevel={character.uncapLevel}
		transcendenceStage={character.transcendenceStep}
		special={character.character?.special}
		flb={character.character?.uncap?.flb}
		ulb={character.character?.uncap?.ulb}
		transcendence={!character.character?.special && character.character?.uncap?.ulb}
	/>
	<span class="character-name">{displayName}</span>
	{#if character.character}
		<CharacterTags character={character.character} />
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.character-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: 2px;
			border-radius: layout.$input-corner;
		}
	}

	.card-image {
		position: relative;
		width: 100%;
		aspect-ratio: 280 / 160;
		border-radius: layout.$input-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.perpetuity-badge {
		position: absolute;
		top: -$unit-half;
		right: $unit;
		width: $unit-3x;
		height: $unit-3x;
		z-index: effects.$z-sticky;
	}

	.character-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: layout.$input-corner;
	}

	.character-name {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: typography.$font-small;
		line-height: 1.4;
		color: var(--text-tertiary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: normal;
		word-break: break-word;
		max-width: 100%;
		max-height: calc(typography.$font-small * 1.4 * 2);
	}
</style>
