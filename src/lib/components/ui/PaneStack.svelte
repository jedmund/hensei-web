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

	// Determine if a pane is becoming active (the one behind a popping pane)
	function isBecomingActive(index: number): boolean {
		return isAnimating && animationDirection === 'pop' && index === panes.length - 2
	}

	// Determine the visual depth of a pane (0 = active, 1 = one behind, 2+ = hidden)
	function getDepth(index: number): number {
		return panes.length - 1 - index
	}

	// Panes more than 1 level deep should be hidden
	function isHidden(index: number): boolean {
		return getDepth(index) > 1
	}
</script>

<div class="pane-stack">
	{#each panes as pane, index (pane.id)}
		{@const isActive = index === panes.length - 1}
		{@const isBehind = index < panes.length - 1}
		{@const showBackButton = index > 0 || pane.onback || onClose}
		{@const PaneComponent = pane.component}
		{@const depth = getDepth(index)}

		<div
			class="pane"
			class:is-active={(isActive && !isPopping(index)) || isBecomingActive(index)}
			class:is-behind={isBehind && !isPopping(index) && !isBecomingActive(index)}
			class:is-pushing={isPushing(index)}
			class:is-popping={isPopping(index)}
			class:is-hidden={isHidden(index)}
			class:scrollable={pane.scrollable !== false}
			style:--pane-depth={depth}
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
	@use '$src/themes/layout' as *;

	// Stacking configuration
	$pane-peek-offset: $unit-3x; // How much the behind pane peeks out to the left

	.pane-stack {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.pane {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;

		// Each pane is its own card
		background: var(--sidebar-bg);
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		border: 1px solid rgba(0, 0, 0, 0.14);
		overflow: hidden;

		transition:
			transform $duration-slide ease-out,
			opacity $duration-slide ease-out;
		will-change: transform, opacity;

		// Active pane (top of stack, fully visible)
		&.is-active {
			transform: translateX(0) scale(1);
			z-index: 10;
			opacity: 1;

			.pane-content {
				opacity: 1;
			}
		}

		// Behind pane (shifted left to peek out)
		&.is-behind {
			transform: translateX(-$pane-peek-offset) scale(0.98);
			z-index: 5;
			opacity: 1;

			.pane-content {
				opacity: 0;
				pointer-events: none;
			}
		}

		// Hidden panes (2+ levels deep)
		&.is-hidden {
			opacity: 0;
			pointer-events: none;
			z-index: 0;
		}

		// Pushing animation (new pane entering from right)
		&.is-pushing {
			animation: pane-enter $duration-slide ease-out forwards;
		}

		// Popping animation (pane exiting to the right)
		&.is-popping {
			animation: pane-exit $duration-slide ease-out forwards;
			z-index: 10; // Keep on top during exit
		}
	}

	@keyframes pane-enter {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes pane-exit {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(100%);
		}
	}

	.pane-content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: opacity $duration-slide ease-out;

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
