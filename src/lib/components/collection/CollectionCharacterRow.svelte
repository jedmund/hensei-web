<script lang="ts">
	import type { CollectionCharacter } from '$lib/types/api/collection'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
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

	const element = $derived(character.character?.element)

	const awakeningDisplay = $derived.by(() => {
		if (!character.awakening) return null
		const type = character.awakening.type?.name?.en || 'Balanced'
		const level = character.awakening.level || 1
		// Abbreviate type names
		const abbrev =
			type === 'Balanced'
				? 'BAL'
				: type === 'Attack'
					? 'ATK'
					: type === 'Defense'
						? 'DEF'
						: type === 'Multiattack'
							? 'DA/TA'
							: type.slice(0, 3).toUpperCase()
		return `${abbrev} ${level}`
	})
</script>

<button type="button" class="character-row" onclick={onClick}>
	<div class="core-info">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} loading="lazy" />
		</div>
		<div class="name-cell">
			<span class="name">{displayName}</span>
			{#if character.perpetuity}
				<img
					class="perpetuity-badge"
					src={perpetuityFilled}
					alt="Perpetuity Ring"
					title="Perpetuity Ring"
				/>
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
			ulb={character.character?.uncap?.ulb}
			transcendence={!character.character?.special && character.character?.uncap?.ulb}
		/>
	</div>

	<div class="awakening-cell">
		{#if awakeningDisplay}
			<span class="awakening">{awakeningDisplay}</span>
		{:else}
			<span class="awakening-placeholder">—</span>
		{/if}
	</div>
</button>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

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
			box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
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
			width: 100px;
			aspect-ratio: 280 / 160;
			border-radius: $item-corner;
			overflow: hidden;
			background: var(--card-bg, #f5f5f5);
			flex-shrink: 0;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.name-cell {
			flex: 1;
			min-width: 0;
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

	.perpetuity-badge {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.uncap-cell {
		width: 100px;
		display: flex;
		justify-content: flex-start;
		flex-shrink: 0;
	}

	.awakening-cell {
		width: 64px;
		display: flex;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	.awakening {
		font-size: $font-small;
		color: var(--text-secondary);
		font-weight: $medium;
	}

	.awakening-placeholder {
		color: var(--text-secondary);
	}
</style>
