<script lang="ts">
	import type { CollectionWeapon } from '$lib/types/api/collection'
	import { getWeaponImage } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		weapon: CollectionWeapon
		onClick?: () => void
	}

	let { weapon, onClick }: Props = $props()

	// Get transformation suffix for transcendence
	const transformation = $derived(weapon.transcendenceStep > 0 ? '02' : undefined)

	// Use instance element for element-changeable weapons
	const displayElement = $derived(weapon.weapon?.element === 0 ? weapon.element : undefined)

	const imageUrl = $derived(
		getWeaponImage(weapon.weapon?.granblueId, 'grid', displayElement, transformation)
	)

	const displayName = $derived.by(() => {
		const name = weapon.weapon?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})
</script>

<button type="button" class="weapon-card" onclick={onClick}>
	<div class="card-image">
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
			border-radius: 8px;
		}
	}

	.card-image {
		position: relative;
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
	}

	.weapon-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 8px;
	}

	.weapon-name {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
</style>
