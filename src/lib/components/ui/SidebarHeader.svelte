<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		/** Title for the sidebar header */
		title: string
		/** Left accessory content (e.g., close/back button) */
		leftAccessory?: Snippet
		/** Right accessory content (e.g., save/edit button) */
		rightAccessory?: Snippet
	}

	const { title, leftAccessory, rightAccessory }: Props = $props()
</script>

<div class="sidebar-header">
	<div class="header-left">
		{#if leftAccessory}
			{@render leftAccessory()}
		{/if}
	</div>

	<h2 class="sidebar-title">{title}</h2>

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
			display: flex;
			align-items: center;
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
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			padding: 0 $unit;
		}
	}
</style>
