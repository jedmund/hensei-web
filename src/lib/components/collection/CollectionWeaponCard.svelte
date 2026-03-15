<script lang="ts">
	import type { CollectionWeapon } from '$lib/types/api/collection'
	import { getWeaponImage, getWeaponTransformation } from '$lib/utils/images'
	import { getAwakeningImage } from '$lib/utils/modifiers'
	import { localizedName } from '$lib/utils/locale'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		weapon: CollectionWeapon
		onClick?: () => void
	}

	let { weapon, onClick }: Props = $props()

	// Get transformation suffix for transcendence
	const transformation = $derived(
		getWeaponTransformation(weapon.weapon?.uncap?.transcendence, weapon.uncapLevel, weapon.transcendenceStep)
	)

	// Use instance element for element-changeable weapons, default to 0 (no element image) if not set
	const displayElement = $derived(weapon.weapon?.element === 0 ? (weapon.element ?? 0) : undefined)

	const imageUrl = $derived(
		getWeaponImage(weapon.weapon?.granblueId, 'grid', displayElement, transformation)
	)

	// Get awakening image URL
	const awakeningImage = $derived(getAwakeningImage(weapon.awakening ?? undefined))

	const displayName = $derived(localizedName(weapon.weapon?.name))
</script>

<button type="button" class="weapon-card" onclick={onClick}>
	<div class="card-image">
		{#if awakeningImage}
			<img
				class="awakening"
				src={awakeningImage}
				alt={`${weapon.awakening?.type?.name ? localizedName(weapon.awakening.type.name) : 'Awakening'} Lv${weapon.awakening?.level || 0}`}
			/>
		{/if}
		<img class="weapon-image" src={imageUrl} alt={displayName} loading="lazy" />
	</div>
	<UncapIndicator
		type="weapon"
		uncapLevel={weapon.uncapLevel}
		transcendenceStage={weapon.transcendenceStep}
		flb={weapon.weapon?.uncap?.flb}
		ulb={weapon.weapon?.uncap?.ulb}
		transcendence={weapon.weapon?.uncap?.transcendence}
	/>
	<span class="weapon-name">{displayName}</span>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.weapon-card {
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
			border-radius: layout.$input-corner;
		}
	}

	.card-image {
		position: relative;
		width: 100%;
		border-radius: layout.$input-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);

		.awakening {
			position: absolute;
			top: 10%;
			left: -3%;
			width: 30%;
			height: auto;
			z-index: effects.$z-badge;
			pointer-events: none;
		}
	}

	.weapon-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: layout.$input-corner;
	}

	.weapon-name {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: typography.$font-small;
		line-height: 1.4;
		color: var(--text-secondary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: normal;
		word-break: break-word;
		max-width: 100%;
		min-height: calc(typography.$font-small * 1.4 * 2);
	}
</style>
