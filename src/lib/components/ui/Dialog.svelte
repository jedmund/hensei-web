<script lang="ts">
	import { Dialog as DialogBase } from 'bits-ui'
	import type { Snippet } from 'svelte'

	type DialogSize = 'default' | 'medium' | 'large'

	interface DialogProps {
		open: boolean
		onOpenChange?: (open: boolean) => void
		size?: DialogSize
		hideClose?: boolean
		children: Snippet
	}

	let {
		open = $bindable(false),
		onOpenChange,
		size = 'default',
		hideClose = false,
		children
	}: DialogProps = $props()

	const sizeClass = $derived(
		size === 'large'
			? 'dialog-content-large'
			: size === 'medium'
				? 'dialog-content-medium'
				: ''
	)

	function handleOpenChange(newOpen: boolean) {
		open = newOpen
		onOpenChange?.(newOpen)
	}
</script>

<DialogBase.Root bind:open onOpenChange={handleOpenChange}>
	<DialogBase.Portal>
		<DialogBase.Overlay class="dialog-overlay" />
		<DialogBase.Content class="dialog-content {sizeClass}">
			{#if !hideClose}
				<DialogBase.Close class="dialog-close">
					<span aria-hidden="true">×</span>
				</DialogBase.Close>
			{/if}

			{@render children()}
		</DialogBase.Content>
	</DialogBase.Portal>
</DialogBase.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
		animation: fade-in $duration-quick ease-out;
	}

	:global(.dialog-content) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background: var(--dialog-bg);
		border-radius: $card-corner;
		box-shadow: var(--shadow-xl);
		max-width: 90vw;
		max-height: 90vh;
		width: 540px;
		z-index: 101;
		animation: slide-up $duration-standard ease-out;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0;
	}

	:global(.dialog-close) {
		position: absolute;
		right: $unit;
		top: $unit;
		width: $unit-4x;
		height: $unit-4x;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		font-size: $unit-3x;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $item-corner-small;
		z-index: 1;
		@include smooth-transition($duration-standard, all);

		&:hover {
			background: var(--button-contained-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	// Medium dialog variant - wider than default, grows with content
	:global(.dialog-content-medium) {
		width: 900px;
	}

	// Large dialog variant for collection modals, etc.
	:global(.dialog-content-large) {
		width: 90vw;
		max-width: 1400px;
		height: 85vh;
		max-height: 85vh;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translate(-50%, -48%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}
</style>
