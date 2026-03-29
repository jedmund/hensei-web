<script lang="ts">
	import type { CollectionSummon } from '$lib/types/api/collection'
	import { localizedName } from '$lib/utils/locale'
	import { getSummonImage, getSummonTransformation } from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	interface Props {
		summon: CollectionSummon
		onClick?: () => void
		editable?: boolean
		onUncapChange?: (level: number) => Promise<void>
		onTranscendenceChange?: (stage: number) => Promise<void>
		unowned?: boolean
	}

	let {
		summon,
		onClick,
		editable = false,
		onUncapChange,
		onTranscendenceChange,
		unowned = false
	}: Props = $props()

	const transformation = $derived(
		getSummonTransformation(summon.summon?.granblueId, summon.uncapLevel, summon.transcendenceStep)
	)

	const imageUrl = $derived(getSummonImage(summon.summon?.granblueId, 'wide', transformation))

	const displayName = $derived(localizedName(summon.summon?.name))
</script>

<button type="button" class="summon-card" class:unowned onclick={onClick}>
	<div class="card-image">
		<img class="summon-image" src={imageUrl} alt={displayName} loading="lazy" />
	</div>
	{#if !unowned}
		<UncapIndicator
			type="summon"
			uncapLevel={summon.uncapLevel}
			transcendenceStage={summon.transcendenceStep}
			flb={summon.summon?.uncap?.flb}
			ulb={summon.summon?.uncap?.ulb}
			transcendence={summon.summon?.uncap?.transcendence}
			{editable}
			updateUncap={onUncapChange}
			updateTranscendence={onTranscendenceChange}
		/>
	{/if}
	<span class="summon-name">{displayName}</span>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.summon-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;

		&.unowned {
			opacity: 0.6;
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
		transition: transform 0.2s ease;

		.summon-card:hover & {
			transform: scale(1.05);
		}
	}

	.summon-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: layout.$input-corner;
	}

	.summon-name {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
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
