<script lang="ts">
	/**
	 * WonderCard - a Wonder's image with its name and level or bonus under
	 * it, dimmed when inactive. Used on the profile and the team tile.
	 */
	import WonderImage from './WonderImage.svelte'
	import { wonderSummary, wonderText } from '$lib/features/wonders/labels'
	import type { OwnedWonder, Wonder } from '$lib/types/api/wonder'

	interface Props {
		wonder: Wonder
		row: OwnedWonder
		/** Image size in px */
		size?: number
		/** Show the name under the image (the team tile shows it as a tooltip) */
		showName?: boolean
		onclick?: () => void
	}

	let { wonder, row, size = 80, showName = true, onclick }: Props = $props()

	const name = $derived(wonderText(wonder.name))
	const summary = $derived(wonderSummary(wonder, row))
	const inactive = $derived(row.active === false)
</script>

<button
	type="button"
	class="wonder-card"
	class:inactive
	style:--wonder-card-width={`${size}px`}
	title={showName ? undefined : name}
	{onclick}
>
	<WonderImage image={row.image} alt={showName ? '' : name} {size} {inactive} />
	{#if showName}
		<span class="name">{name}</span>
	{/if}
	{#if summary}
		<span class="summary">{summary}</span>
	{/if}
</button>

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

		// The same hover scale as the other collection cards' images
		:global(.wonder-image) {
			transition: transform 0.2s ease;
		}

		&:hover :global(.wonder-image) {
			transform: scale(1.05);
		}

		&.inactive .name,
		&.inactive .summary {
			color: var(--text-tertiary);
		}
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
