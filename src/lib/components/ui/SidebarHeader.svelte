<svelte:options runes={true} />

<script lang="ts">
	import Button from './Button.svelte'
	import closeIcon from '$src/assets/icons/close.svg?raw'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Title for the sidebar header */
		title: string
		/** Callback when close is requested */
		onclose?: () => void
		/** Optional additional actions to render in the header */
		actions?: Snippet
	}

	const { title, onclose, actions }: Props = $props()
</script>

<div class="sidebar-header">
	<div class="header-left">
		{#if actions}
			{@render actions()}
		{/if}
	</div>

	<h2 class="sidebar-title">{title}</h2>

	<div class="header-right">
		{#if onclose}
			<button onclick={onclose} class="close-button" aria-label="Close sidebar">
				{@html closeIcon}
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: $nav-height;
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;
		background: var(--bg-primary);

		// Match mobile navigation height
		@media (max-width: 768px) {
			min-height: $nav-height-mobile;
		}

		.header-left,
		.header-right {
			width: 32px; // Same width as close button for balance
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.header-left {
			justify-content: flex-start;
		}

		.header-right {
			justify-content: flex-end;
		}

		.sidebar-title {
			margin: 0;
			font-size: $font-regular;
			font-weight: $medium;
			color: var(--text-primary);
			text-align: center;
			flex: 1;
		}

		.close-button {
			padding: $unit;
			background: transparent;
			border: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			color: var(--text-secondary);
			transition:
				background-color 0.2s,
				color 0.2s;
			width: 32px;
			height: 32px;

			:global(svg) {
				width: 14px;
				height: 14px;
				fill: currentColor;
			}

			&:hover {
				background-color: var(--button-bg);
				color: var(--text-primary);
			}

			&:active {
				transform: translateY(1px);
			}
		}
	}
</style>
