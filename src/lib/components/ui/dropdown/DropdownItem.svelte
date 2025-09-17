<svelte:options runes={true} />

<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import type { Snippet } from 'svelte'

	type Props = {
		children: Snippet
		href?: string
		asChild?: boolean
		class?: string
	}

	const { children, href, asChild = false, class: className = '' }: Props = $props()
</script>

{#if href}
	<DropdownMenu.Item class="dropdown-item {className}" asChild>
		<a {href}>
			{@render children()}
		</a>
	</DropdownMenu.Item>
{:else}
	<DropdownMenu.Item class="dropdown-item {className}" {asChild}>
		{@render children()}
	</DropdownMenu.Item>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	// Define the dropdown item styles as a mixin for reusability
	@mixin dropdown-item-base {
		display: flex;
		align-items: center;
		padding: spacing.$unit (spacing.$unit * 1.5);
		border-radius: 6px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		cursor: pointer;
		outline: none;
		transition: background-color 0.15s ease;
		user-select: none;
		text-decoration: none;

		&:hover {
			background-color: var(--menu-bg-item-hover);
			color: var(--menu-text);
			text-decoration: none;
		}

		&:focus-visible {
			background-color: var(--menu-bg-item-hover);
			outline: 2px solid var(--accent-blue-focus);
			outline-offset: -2px;
		}
	}

	// Apply styles to the dropdown item class that bits-ui adds
	:global(.dropdown-item) {
		// @include dropdown-item-base;

		// Nested form styles for logout button
		form {
			width: 100%;

			button {
				width: 100%;
				text-align: left;
				background: none;
				border: none;
				color: inherit;
				font: inherit;
				cursor: inherit;
				padding: 0;
				margin: 0;
			}
		}
	}

	// Separate global selector for link dropdown items
	:global(.dropdown-item a) {
		@include dropdown-item-base;

		&:link,
		&:visited {
			color: var(--menu-text);
			text-decoration: none;
		}
	}

	:global(.dropdown-item button) {
		@include dropdown-item-base;

		border: none;
		background: none;
		width: 100%;
	}
</style>
