<svelte:options runes={true} />

<script lang="ts">
	import {
		type PaneConfig,
		type PaneStackStore,
		setPaneStackContext
	} from '$lib/stores/paneStack.svelte'
	import SidebarHeader from './SidebarHeader.svelte'
	import Button from './Button.svelte'

	interface Props {
		/** The pane stack store to use */
		stack: PaneStackStore
		/** Callback to close the entire sidebar (for root pane close button) */
		onClose?: () => void
	}

	const { stack, onClose }: Props = $props()

	// Set context so child components can access the pane stack
	setPaneStackContext(stack)

	// Derive values from the stack
	const panes = $derived(stack.panes)
	const isAnimating = $derived(stack.isAnimating)
	const animationDirection = $derived(stack.animationDirection)

	function handleBack(pane: PaneConfig, index: number) {
		if (index === 0 && pane.onback) {
			// Root pane with custom back handler
			pane.onback()
		} else if (index === 0 && onClose) {
			// Root pane, close sidebar
			onClose()
		} else {
			// Non-root pane, pop from stack
			stack.pop()
		}
	}

	// Determine if a pane is the one being pushed (for entry animation)
	function isPushing(index: number): boolean {
		return isAnimating && animationDirection === 'push' && index === panes.length - 1
	}

	// Determine if a pane is the one being popped (for exit animation)
	function isPopping(index: number): boolean {
		return isAnimating && animationDirection === 'pop' && index === panes.length - 1
	}
</script>

<div class="pane-stack">
	{#each panes as pane, index (pane.id)}
		{@const isActive = index === panes.length - 1}
		{@const isBehind = index < panes.length - 1}
		{@const showBackButton = index > 0 || pane.onback || onClose}
		{@const PaneComponent = pane.component}

		<div
			class="pane"
			class:is-active={isActive && !isPopping(index)}
			class:is-behind={isBehind || isPopping(index)}
			class:is-pushing={isPushing(index)}
			class:scrollable={pane.scrollable !== false}
		>
			<SidebarHeader title={pane.title}>
				{#snippet leftAccessory()}
					{#if showBackButton}
						<Button
							variant="ghost"
							size="small"
							iconOnly
							icon={index === 0 && !pane.onback ? 'close' : 'arrow-left'}
							onclick={() => handleBack(pane, index)}
							aria-label={index === 0 && !pane.onback ? 'Close' : 'Go back'}
						/>
					{/if}
				{/snippet}

				{#snippet rightAccessory()}
					{#if pane.action}
						<Button
							variant="ghost"
							size="small"
							element={pane.action.element}
							elementStyle={!!pane.action.element}
							onclick={pane.action.handler}
						>
							{pane.action.label}
						</Button>
					{/if}
				{/snippet}
			</SidebarHeader>

			<div class="pane-content">
				<PaneComponent {...pane.props ?? {}} />
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;

	.pane-stack {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.pane {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: var(--sidebar-bg);
		transition:
			transform $duration-slide ease-out,
			opacity $duration-slide ease-out;
		will-change: transform, opacity;

		// Active pane (top of stack, fully visible)
		&.is-active {
			transform: translateX(0) scale(1);
			z-index: 10;

			.pane-content {
				opacity: 1;
				transition: opacity $duration-slide ease-out;
			}
		}

		// Behind pane (scaled down and shifted left)
		&.is-behind {
			transform: translateX(-20px) scale(0.9);
			z-index: 1;

			.pane-content {
				opacity: 0;
				pointer-events: none;
				transition: opacity $duration-slide ease-out;
			}
		}

		// Pushing animation (new pane entering from right)
		&.is-pushing {
			animation: pane-enter $duration-slide ease-out forwards;
		}
	}

	@keyframes pane-enter {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0) scale(1);
		}
	}

	.pane-content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;

		// Scrollable pane content
		.pane.scrollable & {
			overflow-y: auto;
			overflow-x: hidden;
			scroll-behavior: smooth;
			overflow-y: overlay;

			// Thin, minimal scrollbar styling
			&::-webkit-scrollbar {
				width: 10px;
			}

			&::-webkit-scrollbar-track {
				background: transparent;
			}

			&::-webkit-scrollbar-thumb {
				background: rgba(0, 0, 0, 0.2);
				border-radius: 10px;
				border: 2px solid transparent;
				background-clip: padding-box;

				&:hover {
					background: rgba(0, 0, 0, 0.4);
					background-clip: padding-box;
				}
			}

			// Firefox scrollbar styling
			scrollbar-width: thin;
			scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

			// Improve mobile scrolling performance
			@media (max-width: 768px) {
				-webkit-overflow-scrolling: touch;
			}
		}
	}
</style>
