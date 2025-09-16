<script lang="ts">
	import { Dialog as DialogBase } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'

	interface DialogProps {
		open: boolean
		onOpenChange?: (open: boolean) => void
		title?: string
		description?: string
		children: Snippet
		footer?: Snippet
	}

	let {
		open = $bindable(false),
		onOpenChange,
		title,
		description,
		children,
		footer
	}: DialogProps = $props()

	function handleOpenChange(newOpen: boolean) {
		open = newOpen
		onOpenChange?.(newOpen)
	}
</script>

<DialogBase.Root bind:open onOpenChange={handleOpenChange}>
	<DialogBase.Portal>
		<DialogBase.Overlay class="dialog-overlay" />
		<DialogBase.Content class="dialog-content">
			{#if title}
				<DialogBase.Title class="dialog-title">{title}</DialogBase.Title>
			{/if}
			{#if description}
				<DialogBase.Description class="dialog-description">{description}</DialogBase.Description>
			{/if}

			<DialogBase.Close class="dialog-close">
				<span aria-hidden="true">×</span>
			</DialogBase.Close>

			<div class="dialog-body">
				{@render children()}
			</div>

			{#if footer}
				<div class="dialog-footer">
					{@render footer()}
				</div>
			{/if}
		</DialogBase.Content>
	</DialogBase.Portal>
</DialogBase.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
		animation: fade-in 0.15s ease-out;
	}

	:global(.dialog-content) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background: var(--app-bg, white);
		border-radius: $card-corner;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		max-width: 90vw;
		max-height: 90vh;
		width: 500px;
		z-index: 101;
		animation: slide-up 0.2s ease-out;
		display: flex;
		flex-direction: column;
	}

	:global(.dialog-title) {
		font-size: $font-large;
		font-weight: $bold;
		margin: 0;
		padding: $unit-2x;
		padding-bottom: 0;
		color: var(--text-primary);
	}

	:global(.dialog-description) {
		font-size: $font-regular;
		color: var(--text-secondary);
		padding: 0 $unit-2x;
		margin: $unit 0;
	}

	:global(.dialog-close) {
		position: absolute;
		right: $unit;
		top: $unit;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		font-size: 24px;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $item-corner-small;
		transition: all 0.2s;

		&:hover {
			background: var(--button-contained-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	:global(.dialog-body) {
		padding: $unit-2x;
		overflow-y: auto;
		flex: 1;
	}

	:global(.dialog-footer) {
		padding: $unit-2x;
		padding-top: 0;
		display: flex;
		gap: $unit;
		justify-content: flex-end;
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