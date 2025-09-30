<script lang="ts">
	import { ContextMenu as ContextMenuBase, DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import gearIcon from '$src/assets/icons/gear.svg'

	interface ContextMenuProps {
		children: Snippet
		contextMenu: Snippet
		dropdownMenu: Snippet
		showGearButton?: boolean
	}

	let { children, contextMenu, dropdownMenu, showGearButton = false }: ContextMenuProps = $props()

	let gearMenuOpen = $state(false)
	let contextMenuOpen = $state(false)
</script>

<div class="context-menu-container">
	<ContextMenuBase.Root bind:open={contextMenuOpen}>
		<ContextMenuBase.Trigger>
			{#snippet child({ props })}
				<div class="context-trigger" {...props}>
					{@render children()}
				</div>
			{/snippet}
		</ContextMenuBase.Trigger>

		<ContextMenuBase.Portal>
			<ContextMenuBase.Content class="context-menu">
				{@render contextMenu()}
			</ContextMenuBase.Content>
		</ContextMenuBase.Portal>
	</ContextMenuBase.Root>

	{#if showGearButton}
		<DropdownMenuBase.Root bind:open={gearMenuOpen}>
			<DropdownMenuBase.Trigger class="gear-button-trigger">
				{#snippet child({ props })}
					<button
						{...props}
						class="gear-button"
						oncontextmenu={(e) => e.preventDefault()}
						type="button"
					>
						<img src={gearIcon} alt="Options" />
					</button>
				{/snippet}
			</DropdownMenuBase.Trigger>

			<DropdownMenuBase.Portal>
				<DropdownMenuBase.Content class="dropdown-menu" side="bottom" align="start" sideOffset={4}>
					{@render dropdownMenu()}
				</DropdownMenuBase.Content>
			</DropdownMenuBase.Portal>
		</DropdownMenuBase.Root>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.context-menu-container {
		position: relative;
		display: inline-block;
	}

	.context-menu-container:hover :global(.gear-button) {
		opacity: 1;
		pointer-events: auto;
	}

	.context-trigger {
		display: block;
	}

	:global(.gear-button-trigger) {
		width: 32px;
		height: 32px;
		z-index: 10;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;

		&[data-state='open'] {
			opacity: 1;
			pointer-events: auto;
		}
	}

	.gear-button {
		position: absolute;
		top: $unit;
		left: $unit;
		z-index: 99;
		width: 32px;
		height: 32px;
		padding: 0;
		opacity: 0;
		pointer-events: none;
		border: none;
		background: rgba(0, 0, 0, 0.6);
		border-radius: $item-corner;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;

		&[data-state='open'] {
			opacity: 1;
			pointer-events: auto;
		}

		&:hover {
			background: rgba(0, 0, 0, 0.8);
			transform: scale(1.05);
		}

		img {
			width: 16px;
			height: 16px;
			display: block;
			color: white;
			filter: brightness(0) invert(1);
		}
	}

	.context-menu-container:hover :global(.gear-button-trigger) {
		opacity: 1;
		pointer-events: auto;
	}

	:global(.context-menu) {
		background: var(--app-bg, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: $card-corner;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: $unit-half;
		min-width: calc($unit * 22.5);
		z-index: 200;
		animation: slideIn $duration-quick ease-out;
	}

	:global(.context-menu-item) {
		padding: $unit $unit-2x;
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-regular;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: $unit;
		@include smooth-transition($duration-standard, background);

		&:hover {
			background: var(--button-contained-bg-hover, #f5f5f5);
		}

		&:first-child {
			border-top-left-radius: $item-corner;
			border-top-right-radius: $item-corner;
		}

		&:last-child {
			border-bottom-left-radius: $item-corner;
			border-bottom-right-radius: $item-corner;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	:global(.context-menu-item.danger) {
		color: var(--danger);

		&:hover {
			background: var(--danger-bg);
		}
	}

	:global(.context-menu-separator) {
		border-radius: $full-corner;
		height: 2px;
		background: var(--menu-separator);
		margin: $unit-half ($unit * 0.75);
	}

	// Dropdown menu styles (same as context menu)
	:global(.dropdown-menu) {
		background: var(--app-bg, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: $card-corner;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: $unit-half;
		min-width: calc($unit * 22.5);
		z-index: 200;
		animation: slideIn $duration-quick ease-out;
	}

	:global(.dropdown-menu-item) {
		padding: $unit $unit-2x;
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-regular;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: $unit;
		@include smooth-transition($duration-standard, background);

		&:hover {
			background: var(--button-contained-bg-hover, #f5f5f5);
		}

		&:first-child {
			border-top-left-radius: $item-corner;
			border-top-right-radius: $item-corner;
		}

		&:last-child {
			border-bottom-left-radius: $item-corner;
			border-bottom-right-radius: $item-corner;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	:global(.dropdown-menu-item.danger) {
		color: var(--danger);

		&:hover {
			background: var(--danger-bg);
		}
	}

	:global(.dropdown-menu-separator) {
		border-radius: $full-corner;
		height: 2px;
		background: var(--menu-separator);
		margin: $unit-half ($unit * 0.75);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-$unit-fourth);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
