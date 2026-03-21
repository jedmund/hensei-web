<script lang="ts">
	import type { Snippet } from 'svelte'
	import ContextMenuWrapper from './ContextMenuWrapper.svelte'
	import GearMenuButton from './GearMenuButton.svelte'

	type MenuVariant = 'context' | 'dropdown'

	interface UnitMenuContainerProps {
		trigger: Snippet
		contextMenu?: Snippet
		dropdownMenu?: Snippet
		menu?: Snippet<[MenuVariant]>
		showGearButton?: boolean
		gearPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
	}

	let {
		trigger,
		contextMenu,
		dropdownMenu,
		menu,
		showGearButton = false,
		gearPosition = 'top-left'
	}: UnitMenuContainerProps = $props()

	let contextMenuOpen = $state(false)
	let gearMenuOpen = $state(false)

	// If no dropdown menu is provided, use the context menu for both
	const effectiveDropdownMenu = dropdownMenu ?? contextMenu
</script>

{#snippet contextMenuFromVariant()}
	{#if menu}
		{@render menu('context')}
	{/if}
{/snippet}

{#snippet dropdownMenuFromVariant()}
	{#if menu}
		{@render menu('dropdown')}
	{/if}
{/snippet}

<div class="unit-menu-container">
	<ContextMenuWrapper
		{trigger}
		menu={menu ? contextMenuFromVariant : contextMenu!}
		bind:open={contextMenuOpen}
	/>

	{#if showGearButton}
		<GearMenuButton
			menu={menu ? dropdownMenuFromVariant : effectiveDropdownMenu!}
			position={gearPosition}
			bind:open={gearMenuOpen}
		/>
	{/if}
</div>

<style lang="scss">
	@use './menu-styles.scss';

	.unit-menu-container {
		position: relative;
		display: inline-block;

		// Show gear button on hover of the container
		&:hover :global(.gear-button-trigger) {
			opacity: 1;
			pointer-events: auto;
		}

		&:hover :global(.gear-button.show-on-hover) {
			opacity: 1;
			pointer-events: auto;
		}
	}
</style>
