<script lang="ts">
	import type { CollectionSummon } from '$lib/types/api/collection'
	import { getSummonImage } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	interface Props {
		summon: CollectionSummon
		onClick?: () => void
	}

	let { summon, onClick }: Props = $props()

	// Get transformation suffix for transcendence
	const transformation = $derived(summon.transcendenceStep > 0 ? '02' : undefined)

	const imageUrl = $derived(getSummonImage(summon.summon?.granblueId, 'wide', transformation))

	const displayName = $derived.by(() => {
		const name = summon.summon?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})
</script>

<button type="button" class="summon-card" onclick={onClick}>
	<div class="card-image">
		<img class="summon-image" src={imageUrl} alt={displayName} loading="lazy" />
	</div>
	<UncapIndicator
		type="summon"
		uncapLevel={summon.uncapLevel}
		transcendenceStage={summon.transcendenceStep}
		flb={summon.summon?.uncap?.flb}
		ulb={summon.summon?.uncap?.ulb}
		transcendence={summon.summon?.uncap?.transcendence}
	/>
	<span class="summon-name">{displayName}</span>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as typography;

	.summon-card {
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

	.summon-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 8px;
	}

	.summon-name {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
</style>
