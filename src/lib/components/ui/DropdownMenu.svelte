<script lang="ts">
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface TriggerProps {
		props: Record<string, unknown>
	}

	interface DropdownMenuProps {
		trigger: Snippet<[TriggerProps]>
		menu: Snippet
		open?: boolean
	}

	let { trigger, menu, open = $bindable(false) }: DropdownMenuProps = $props()
</script>

<DropdownMenuBase.Root bind:open>
	<DropdownMenuBase.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</DropdownMenuBase.Trigger>

	<DropdownMenuBase.Portal>
		<DropdownMenuBase.Content class="dropdown-menu" side="bottom" align="start" sideOffset={4}>
			{@render menu()}
		</DropdownMenuBase.Content>
	</DropdownMenuBase.Portal>
</DropdownMenuBase.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	:global(.dropdown-menu) {
		background: var(--menu-bg, white);
		border: 1px solid var(--border-subtle);
		border-radius: $card-corner;
		box-shadow: var(--shadow-md);
		padding: $unit-half;
		min-width: calc($unit * 22.5);
		z-index: $z-modal;
		animation: slideIn $duration-quick ease-out;
	}

	:global(.dropdown-menu-item) {
		padding: $unit $unit-2x;
		border-radius: $item-corner-small;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: $font-regular;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		text-align: left;
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
		background: var(--border-subtle);
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