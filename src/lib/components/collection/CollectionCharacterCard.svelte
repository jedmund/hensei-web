<script lang="ts">
	import type { CollectionCharacter } from '$lib/types/api/collection'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
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
			character.transcendenceStep
		)
	)

	const displayName = $derived.by(() => {
		const name = character.character?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})
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
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as typography;

	.character-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
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
			border-radius: 8px;
		}
	}

	.card-image {
		position: relative;
		width: 100%;
		aspect-ratio: 280 / 160;
		border-radius: 8px;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.perpetuity-badge {
		position: absolute;
		top: -$unit-half;
		right: $unit;
		width: $unit-3x;
		height: $unit-3x;
		z-index: 10;
	}

	.character-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}

	.character-name {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
</style>
