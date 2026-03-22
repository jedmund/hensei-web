<script lang="ts">
	import type { CollectionCharacter } from '$lib/types/api/collection'
	import { localizedName } from '$lib/utils/locale'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import * as m from '$lib/paraglide/messages'

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

	const element = $derived(character.character?.element)
	const proficiencies = $derived(character.character?.proficiency ?? [])
</script>

<button type="button" class="character-row" onclick={onClick}>
	<div class="core-info">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} loading="lazy" />
			{#if character.perpetuity}
				<img
					class="perpetuity-badge"
					src={perpetuityFilled}
					alt={m.label_perpetuity_ring()}
					title={m.label_perpetuity_ring()}
				/>
			{/if}
		</div>
		<div class="name-cell">
			<div class="name-row">
				<span class="name">{displayName}</span>
			</div>
			{#if character.character}
				<CharacterTags character={character.character} />
			{/if}
		</div>
	</div>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>

	<div class="uncap-cell">
		<UncapIndicator
			type="character"
			uncapLevel={character.uncapLevel}
			transcendenceStage={character.transcendenceStep}
			special={character.character?.special}
			flb={character.character?.uncap?.flb}
			ulb={character.character?.uncap?.transcendence}
			transcendence={character.character?.uncap?.transcendence}
		/>
	</div>

	<div class="proficiency-cell">
		{#each proficiencies as proficiency}
			<ProficiencyLabel {proficiency} size="medium" />
		{/each}
	</div>
</button>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as effects;

	.character-row {
		display: flex;
		align-items: center;
		gap: $unit-4x;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: var(--list-cell-bg);
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: $card-corner;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
			box-shadow: var(--shadow-md);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: -2px;
		}
	}

	.core-info {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		flex-grow: 1;

		.thumbnail {
			position: relative;
			width: 100px;
			aspect-ratio: 280 / 160;
			border-radius: $item-corner;
			overflow: visible;
			background: var(--card-bg, #f5f5f5);
			flex-shrink: 0;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: $item-corner;
			}

			.perpetuity-badge {
				position: absolute;
				top: calc($unit * -1);
				right: $unit-2x;
				width: $unit-3x;
				height: $unit-3x;
				z-index: effects.$z-sticky;
			}
		}

		.name-cell {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: $unit-half;
		}

		.name-row {
			display: flex;
			align-items: center;
			gap: $unit;

			.name {
				font-size: $font-regular;
				font-weight: $medium;
				color: var(--text-primary);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

		}
	}

	.uncap-cell {
		width: 100px;
		display: flex;
		justify-content: flex-start;
		flex-shrink: 0;
	}

	.proficiency-cell {
		display: flex;
		gap: $unit-half;
		flex-shrink: 0;
		min-width: 130px;
		justify-content: flex-end;
	}
</style>
