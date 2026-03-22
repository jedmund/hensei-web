<script lang="ts">
	import type { CollectionWeapon } from '$lib/types/api/collection'
	import { getWeaponImage, getWeaponFallbackImage, handleImageFallback } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '../labels/ProficiencyLabel.svelte'
	interface Props {
		weapon: CollectionWeapon
		onClick?: () => void
	}

	let { weapon, onClick }: Props = $props()

	// Get transformation suffix for transcendence
	const transformation = $derived(weapon.transcendenceStep > 0 ? '02' : undefined)

	// Use instance element for element-changeable weapons, default to 0 (no element image) if not set
	const displayElement = $derived(weapon.weapon?.element === 0 ? (weapon.element ?? 0) : undefined)

	const imageUrl = $derived(
		getWeaponImage(weapon.weapon?.granblueId, 'grid', displayElement, transformation, weapon.weapon?.elementVariantIds)
	)

	// Fallback URL for element-changeable weapons whose _0 image doesn't exist
	const weaponFallbackUrl = $derived(
		weapon.weapon?.element === 0 ? getWeaponFallbackImage(weapon.weapon?.granblueId, 'grid', transformation) : undefined
	)

	const displayName = $derived(localizedName(weapon.weapon?.name))

	// Show instance element for element-changeable, otherwise show weapon's base element
	const element = $derived(weapon.weapon?.element === 0 ? weapon.element : weapon.weapon?.element)

	// Weapon proficiency
	const proficiency = $derived(weapon.weapon?.proficiency)

	// Awakening display
	const awakeningDisplay = $derived.by(() => {
		if (!weapon.awakening) return null
		const type = weapon.awakening.type?.name ? localizedName(weapon.awakening.type.name) : 'Balanced'
		const level = weapon.awakening.level || 1
		const abbrev =
			type === 'Balanced'
				? 'BAL'
				: type === 'Attack'
					? 'ATK'
					: type === 'Defense'
						? 'DEF'
						: type.slice(0, 3).toUpperCase()
		return `${abbrev} ${level}`
	})

	// Weapon keys count (for display)
	const keyCount = $derived(weapon.weaponKeys?.length ?? 0)
</script>

<button type="button" class="weapon-row" onclick={onClick}>
	<div class="core-info">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} loading="lazy" onerror={(e) => handleImageFallback(e, weaponFallbackUrl)} />
		</div>

		<div class="name-cell">
			<span class="name">{displayName}</span>
		</div>
	</div>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>

	<div class="uncap-cell">
		<UncapIndicator
			type="weapon"
			uncapLevel={weapon.uncapLevel}
			transcendenceStage={weapon.transcendenceStep}
			flb={weapon.weapon?.uncap?.flb}
			ulb={weapon.weapon?.uncap?.ulb}
			transcendence={weapon.weapon?.uncap?.transcendence}
		/>
	</div>

	<div class="proficiency-cell">
		<ProficiencyLabel {proficiency} size="medium" />
	</div>

	<!-- <div class="extra-cell">
		{#if awakeningDisplay}
			<span class="awakening">{awakeningDisplay}</span>
		{:else if keyCount > 0}
			<span class="keys">{keyCount} keys</span>
		{:else}
			<span class="placeholder">—</span>
		{/if}
	</div> -->
</button>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.weapon-row {
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

	.element-cell {
		flex-shrink: 0;
	}

	.uncap-cell {
		width: 100px;
		display: flex;
		justify-content: flex-start;
		flex-shrink: 0;
	}

	.extra-cell {
		width: 64px;
		display: flex;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	.awakening,
	.keys {
		font-size: $font-small;
		color: var(--text-secondary);
		font-weight: $medium;
	}

	.placeholder {
		color: var(--text-secondary);
	}
</style>
