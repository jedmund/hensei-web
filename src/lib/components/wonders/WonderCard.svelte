<script lang="ts">
	/**
	 * WonderCard - a Wonder's image with its name and level or bonus under
	 * it, dimmed when inactive. Used on the profile and the team's edit pane
	 * (level as a badge on the image, like artifact cards) and the team tile.
	 */
	import WonderImage from './WonderImage.svelte'
	import { m } from '$lib/paraglide/messages'
	import { wonderSummary, wonderText } from '$lib/features/wonders/labels'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import type { OwnedWonder, Wonder } from '$lib/types/api/wonder'

	interface Props {
		wonder: Wonder
		row: OwnedWonder
		/** Image size in px */
		size?: number
		/** Show the name under the image (the team tile shows it as a tooltip) */
		showName?: boolean
		/** Show a leveled Wonder's level as a badge on the image */
		levelBadge?: boolean
		onclick?: () => void
	}

	let { wonder, row, size = 80, showName = true, levelBadge = false, onclick }: Props = $props()

	const name = $derived(wonderText(wonder.name))
	const badge = $derived(
		levelBadge && wonder.kind === 'leveled' && row.level != null
			? m.wonders_level({ level: row.level })
			: null
	)
	// The level moves into the badge; Symbolum's bonus stays below
	const summary = $derived(badge ? null : wonderSummary(wonder, row))
	const inactive = $derived(row.active === false)
</script>

<!-- Without a visible name, hovering shows it -->
<Tooltip content={name} disabled={showName}>
	<button
		type="button"
		class="wonder-card"
		class:inactive
		style:--wonder-card-width={`${size}px`}
		{onclick}
	>
		<span class="image">
			<WonderImage image={row.image} alt={showName ? '' : name} {size} {inactive} />
			{#if badge}
				<span class="level-badge">{badge}</span>
			{/if}
		</span>
		{#if showName}
			<span class="name">{name}</span>
		{/if}
		{#if summary}
			<span class="summary">{summary}</span>
		{/if}
	</button>
</Tooltip>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.wonder-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		width: var(--wonder-card-width);
		padding: 0;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		text-align: center;
		cursor: pointer;
		@include smooth-transition($duration-quick, transform);

		&:active {
			transform: scale(0.97);
		}

		// The same hover scale as the other collection cards' images; the
		// badge scales with its image
		.image {
			transition: transform 0.2s ease;
		}

		&:hover .image {
			transform: scale(1.05);
		}

		&.inactive .name,
		&.inactive .summary {
			color: var(--text-tertiary);
		}
	}

	.image {
		position: relative;
		display: block;
	}

	// The same badge as CollectionArtifactCard's level
	.level-badge {
		position: absolute;
		top: $unit-fourth;
		right: $unit-fourth;
		font-size: $font-small;
		font-weight: $bold;
		padding: 2px 6px;
		border-radius: $item-corner-small;
		line-height: 1;
		background: var(--grey-80, #e9e9e9);
		color: var(--grey-40, #444);
	}

	.name {
		width: 100%;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;
		overflow-wrap: anywhere;
	}

	.summary {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}
</style>
