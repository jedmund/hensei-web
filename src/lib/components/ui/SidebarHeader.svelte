<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		/** Title for the sidebar header */
		title: string
		/** Optional image URL to display next to the title */
		image?: string
		/** Left accessory content (e.g., close/back button) */
		leftAccessory?: Snippet
		/** Right accessory content (e.g., save/edit button) */
		rightAccessory?: Snippet
	}

	const { title, image, leftAccessory, rightAccessory }: Props = $props()
</script>

<div class="sidebar-header">
	<div class="header-left">
		{#if leftAccessory}
			{@render leftAccessory()}
		{/if}
	</div>

	<div class="sidebar-title-container">
		{#if image}
			<img src={image} alt="" class="title-image" />
		{/if}
		<h2 class="sidebar-title">{title}</h2>
	</div>

	<div class="header-right">
		{#if rightAccessory}
			{@render rightAccessory()}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.sidebar-header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: $unit;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;
		background: var(--bg-primary);

		// Match mobile navigation height
		@media (max-width: 768px) {
			min-height: $nav-height-mobile;
		}

		.header-left,
		.header-right {
			display: flex;
			align-items: center;

			// Ensure all buttons in header have consistent height
			:global([data-button-root]) {
				height: calc($unit * 4) !important;

				// Icon-only buttons should be square
				&.iconOnly {
					width: calc($unit * 4) !important;
				}
			}
		}

		.header-left {
			justify-content: flex-start;
		}

		.header-right {
			justify-content: flex-end;
			gap: $unit-half;
		}

		.sidebar-title-container {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $unit-half;
		}

		.title-image {
			width: calc($unit * 3);
			height: calc($unit * 3);
			object-fit: contain;
			border-radius: $item-corner-small;
			flex-shrink: 0;
		}

		.sidebar-title {
			margin: 0;
			font-size: $font-regular;
			font-weight: $medium;
			color: var(--text-primary);
			text-align: center;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			padding: 0 $unit;
		}
	}
</style>
