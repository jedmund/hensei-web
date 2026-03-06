<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import gearIcon from '$src/assets/icons/gear.svg'

	interface GearMenuButtonProps {
		menu: Snippet
		position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
		showOnHover?: boolean
		open?: boolean
	}

	let {
		menu,
		position = 'top-left',
		showOnHover = true,
		open = $bindable(false)
	}: GearMenuButtonProps = $props()
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger class="gear-button-trigger" data-position={position}>
		{#snippet child({ props })}
			<button
				{...props}
				class="gear-button"
				class:show-on-hover={showOnHover}
				data-position={position}
				oncontextmenu={(e) => e.preventDefault()}
				type="button"
			>
				<img src={gearIcon} alt="Options" />
			</button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content class="dropdown-menu" side="bottom" align="start" sideOffset={4}>
			{@render menu()}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style lang="scss">
	@use './menu-styles.scss';
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	:global(.gear-button-trigger) {
		width: 32px;
		height: 32px;
		z-index: $z-sticky;
		opacity: 0;
		pointer-events: none;
		@include smooth-transition($duration-standard, opacity);

		&[data-state='open'] {
			opacity: 1;
			pointer-events: auto;
		}
	}

	.gear-button {
		position: absolute;
		z-index: $z-modal;
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		background: rgba(0, 0, 0, 0.6);
		border-radius: $item-corner;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		@include smooth-transition($duration-standard, all);

		// Position based on data attribute
		&[data-position='top-left'] {
			top: $unit;
			left: $unit;
		}

		&[data-position='top-right'] {
			top: $unit;
			right: $unit;
		}

		&[data-position='bottom-left'] {
			bottom: $unit;
			left: $unit;
		}

		&[data-position='bottom-right'] {
			bottom: $unit;
			right: $unit;
		}

		&.show-on-hover {
			opacity: 0;
			pointer-events: none;
		}

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
</style>
