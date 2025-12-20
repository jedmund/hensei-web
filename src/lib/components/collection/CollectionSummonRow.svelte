<script lang="ts">
	import type { CollectionSummon } from '$lib/types/api/collection'
	import { getSummonImage } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'

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

	// Summon element
	const element = $derived(summon.summon?.element)
</script>

<button type="button" class="summon-row" onclick={onClick}>
	<div class="core-info">
		<div class="thumbnail">
			<img src={imageUrl} alt={displayName} loading="lazy" />
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
			type="summon"
			uncapLevel={summon.uncapLevel}
			transcendenceStage={summon.transcendenceStep}
			flb={summon.summon?.uncap?.flb}
			ulb={summon.summon?.uncap?.ulb}
			transcendence={summon.summon?.uncap?.transcendence}
		/>
	</div>
</button>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.summon-row {
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

	.placeholder {
		color: var(--text-secondary);
	}
</style>
