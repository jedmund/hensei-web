<script lang="ts">
	import { Dialog } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface Props {
		open: boolean
		onOpenChange?: (open: boolean) => void
		title?: string
		children: Snippet
	}

	let { open = $bindable(false), onOpenChange, title, children }: Props = $props()

	function handleOpenChange(newOpen: boolean) {
		open = newOpen
		onOpenChange?.(newOpen)
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="sheet-overlay" />
		<Dialog.Content class="sheet-content">
			<div class="sheet-handle-bar">
				<div class="sheet-handle"></div>
			</div>
			{#if title}
				<div class="sheet-header">
					<h3 class="sheet-title">{title}</h3>
					<Dialog.Close class="sheet-close">
						<span aria-hidden="true">×</span>
					</Dialog.Close>
				</div>
			{/if}
			<div class="sheet-body">
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	:global(.sheet-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: $z-modal;
		animation: sheet-fade-in $duration-quick ease-out;
	}

	:global(.sheet-content) {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--dialog-bg);
		color: var(--text-primary);
		border-radius: $card-corner $card-corner 0 0;
		box-shadow: var(--shadow-xl);
		max-height: 85vh;
		z-index: $z-modal + 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: sheet-slide-up $duration-slide ease-out;
	}

	.sheet-handle-bar {
		display: flex;
		justify-content: center;
		padding: $unit-half 0;
		flex-shrink: 0;
	}

	.sheet-handle {
		width: $unit-5x;
		height: $unit-half;
		background: var(--text-tertiary);
		border-radius: $full-corner;
		opacity: 0.4;
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 $unit-2x $unit;
		flex-shrink: 0;
	}

	.sheet-title {
		font-size: $font-regular;
		font-weight: $bold;
		margin: 0;
	}

	:global(.sheet-close) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: $unit-4x;
		height: $unit-4x;
		border: none;
		background: transparent;
		font-size: $unit-3x;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: $item-corner-small;
		@include smooth-transition($duration-standard, all);

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}

	.sheet-body {
		overflow-y: auto;
		flex: 1;
		padding: 0 $unit-2x $unit-2x;
		// Safe area for phones with home indicator
		padding-bottom: calc($unit-2x + env(safe-area-inset-bottom, 0px));
	}

	@keyframes sheet-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes sheet-slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
