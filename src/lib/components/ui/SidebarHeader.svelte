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
	<h2 class="sidebar-title">{title}</h2>

	{#if actions}
		<div class="header-actions">
			{@render actions()}
		</div>
	{/if}

	{#if onclose}
		<button
			onclick={onclose}
			class="close-button"
			aria-label="Close sidebar"
		>
			{@html closeIcon}
		</button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;
		background: var(--bg-primary);

		.sidebar-title {
			flex: 1;
			margin: 0;
			font-size: $font-large;
			font-weight: $bold;
			color: var(--text-primary);
		}

		.header-actions {
			display: flex;
			gap: $unit;
			align-items: center;
		}

		.close-button {
			margin-left: $unit;
			padding: $unit;
			background: transparent;
			border: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			color: var(--text-secondary);
			transition: background-color 0.2s, color 0.2s;
			width: 32px;
			height: 32px;
			flex-shrink: 0;

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