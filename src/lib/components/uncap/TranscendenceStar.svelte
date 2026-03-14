
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import TranscendenceFragment from './TranscendenceFragment.svelte'
	import { Portal } from 'bits-ui'

	interface Props {
		className?: string
		stage?: number
		type?: 'character' | 'weapon' | 'summon'
		editable?: boolean
		interactive?: boolean
		tabindex?: number
		size?: 'regular' | 'small'
		onStarClick?: () => void
		onFragmentClick?: (newStage: number) => void
		onFragmentHover?: (newStage: number) => void
	}

	let {
		className,
		stage = 0,
		type = 'character',
		editable = false,
		interactive = false,
		tabindex,
		size = 'regular',
		onStarClick,
		onFragmentClick,
		onFragmentHover
	}: Props = $props()

	const NUM_FRAGMENTS = 5

	interface PopoverPosition {
		top: number
		left: number
		placement: 'above' | 'below'
	}

	let visibleStage = $state(stage)
	let currentStage = $state(stage)
	let immutable = $state(false)
	let isPopoverOpen = $state(false)
	let popoverPosition = $state<PopoverPosition | null>(null)
	let starElement: HTMLDivElement
	let popoverElement: HTMLDivElement

	const baseLevel = $derived(type === 'character' ? 100 : 200)
	const displayLevel = $derived(baseLevel + 10 * visibleStage)

	function calculatePopoverPosition(): PopoverPosition | null {
		if (!starElement) return null

		const rect = starElement.getBoundingClientRect()
		const popoverWidth = 100 // Approximate width
		const popoverHeight = 120 // Approximate height
		const gap = 8 // Gap between star and popover

		// Calculate available space
		const spaceBelow = window.innerHeight - rect.bottom
		const spaceAbove = rect.top

		// Determine vertical placement
		const placement: 'above' | 'below' =
			spaceBelow < popoverHeight && spaceAbove > spaceBelow ? 'above' : 'below'

		// Calculate vertical position
		let top = placement === 'below' ? rect.bottom + gap : rect.top - popoverHeight - gap

		// Center horizontally on star
		let left = rect.left + rect.width / 2 - popoverWidth / 2

		// Adjust horizontal position if too close to edges
		const edgeMargin = 8
		if (left < edgeMargin) {
			left = edgeMargin
		} else if (left + popoverWidth > window.innerWidth - edgeMargin) {
			left = window.innerWidth - popoverWidth - edgeMargin
		}

		return { top, left, placement }
	}

	$effect(() => {
		visibleStage = stage
		currentStage = stage
	})

	$effect(() => {
		if (isPopoverOpen) {
			// Update position when popover opens
			popoverPosition = calculatePopoverPosition()

			const handleClickOutside = (event: MouseEvent) => {
				if (
					starElement &&
					!starElement.contains(event.target as Node) &&
					popoverElement &&
					!popoverElement.contains(event.target as Node)
				) {
					isPopoverOpen = false
					popoverPosition = null
				}
			}

			const updatePosition = () => {
				popoverPosition = calculatePopoverPosition()
			}

			// Add listeners
			document.addEventListener('click', handleClickOutside)
			window.addEventListener('scroll', updatePosition, true)
			window.addEventListener('resize', updatePosition)

			return () => {
				document.removeEventListener('click', handleClickOutside)
				window.removeEventListener('scroll', updatePosition, true)
				window.removeEventListener('resize', updatePosition)
			}
		}
	})

	function handleClick() {
		if (editable && onStarClick) {
			onStarClick()
		} else if (interactive) {
			isPopoverOpen = !isPopoverOpen
		}
	}

	function handleFragmentClick(index: number) {
		let newStage = index
		if (index === currentStage) {
			newStage = 0
		}

		visibleStage = newStage
		currentStage = newStage
		if (onFragmentClick) {
			onFragmentClick(newStage)
		}
		isPopoverOpen = false
	}

	function handleFragmentHover(index: number) {
		visibleStage = index
		if (onFragmentHover) {
			onFragmentHover(index)
		}
	}

	function handleMouseLeave() {
		visibleStage = currentStage
		if (onFragmentHover) {
			onFragmentHover(currentStage)
		}
	}
</script>

<div
	class="star TranscendenceStar"
	class:immutable
	class:empty={stage === 0}
	class:stage1={stage === 1}
	class:stage2={stage === 2}
	class:stage3={stage === 3}
	class:stage4={stage === 4}
	class:stage5={stage === 5}
	class:small={size === 'small'}
	onclick={handleClick}
	onmouseleave={interactive ? handleMouseLeave : undefined}
	bind:this={starElement}
	{tabindex}
	role={editable ? 'button' : undefined}
	aria-label={editable ? 'Transcendence star' : undefined}
>
	{#if interactive && isPopoverOpen && popoverPosition}
		<Portal>
			<div
				class="popover"
				class:above={popoverPosition.placement === 'above'}
				style="top: {popoverPosition.top}px; left: {popoverPosition.left}px"
				bind:this={popoverElement}
			>
				<div class="fragments">
					{#each Array(NUM_FRAGMENTS) as _, i}
						{@const loopStage = i + 1}
						<TranscendenceFragment
							stage={loopStage}
							visible={loopStage <= visibleStage}
							{interactive}
							onClick={handleFragmentClick}
							onHover={handleFragmentHover}
						/>
					{/each}
				</div>
				<div class="level">
					<span>{m.label_level()}</span>
					<span class="level-value" class:pending={visibleStage !== currentStage}>{displayLevel}</span>
				</div>
			</div>
		</Portal>
	{/if}
	<i class="figure {className || ''}" class:interactive class:base={className?.includes('base')} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.star {
		--size: 18px;
		position: relative;
		cursor: pointer;

		&.small {
			--size: 12px;
		}

		&:hover {
			transform: scale(1.2);
		}

		&.immutable {
			pointer-events: none;
		}

		&.empty {
			background-image: url('$src/assets/icons/transcendence/0/stage-0.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage1 {
			background-image: url('$src/assets/icons/transcendence/1/stage-1.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage2 {
			background-image: url('$src/assets/icons/transcendence/2/stage-2.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage3 {
			background-image: url('$src/assets/icons/transcendence/3/stage-3.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage4 {
			background-image: url('$src/assets/icons/transcendence/4/stage-4.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage5 {
			background-image: url('$src/assets/icons/transcendence/5/stage-5.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		/* High DPI support */
		@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
			&.empty {
				background-image: url('$src/assets/icons/transcendence/0/stage-0@2x.png');
			}
			&.stage1 {
				background-image: url('$src/assets/icons/transcendence/1/stage-1@2x.png');
			}
			&.stage2 {
				background-image: url('$src/assets/icons/transcendence/2/stage-2@2x.png');
			}
			&.stage3 {
				background-image: url('$src/assets/icons/transcendence/3/stage-3@2x.png');
			}
			&.stage4 {
				background-image: url('$src/assets/icons/transcendence/4/stage-4@2x.png');
			}
			&.stage5 {
				background-image: url('$src/assets/icons/transcendence/5/stage-5@2x.png');
			}
		}

		@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
			&.empty {
				background-image: url('$src/assets/icons/transcendence/0/stage-0@3x.png');
			}
			&.stage1 {
				background-image: url('$src/assets/icons/transcendence/1/stage-1@3x.png');
			}
			&.stage2 {
				background-image: url('$src/assets/icons/transcendence/2/stage-2@3x.png');
			}
			&.stage3 {
				background-image: url('$src/assets/icons/transcendence/3/stage-3@3x.png');
			}
			&.stage4 {
				background-image: url('$src/assets/icons/transcendence/4/stage-4@3x.png');
			}
			&.stage5 {
				background-image: url('$src/assets/icons/transcendence/5/stage-5@3x.png');
			}
		}

		.figure {
			--size: 18px;
			background-repeat: no-repeat;
			background-size: 54px 54px;
			display: block;
			height: var(--size);
			width: var(--size);

			&.interactive.base {
				--size: calc(spacing.$unit * 6);
				background-image: url('$src/assets/icons/transcendence/interactive/interactive-base.png');
				background-size: var(--size) var(--size);
				height: var(--size);
				width: var(--size);

				&:hover {
					cursor: pointer;
					transform: none;
				}

				/* High DPI support */
				@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
					background-image: url('$src/assets/icons/transcendence/interactive/interactive-base@2x.png');
				}

				@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
					background-image: url('$src/assets/icons/transcendence/interactive/interactive-base@3x.png');
				}
			}

			&:hover {
				transform: scale(1.2);
			}
		}

		&.small .figure {
			--size: 12px;
		}
	}

	.popover {
		position: fixed;
		z-index: effects.$z-notification + 1;
		background: var(--card-bg);
		border-radius: layout.$input-corner;
		box-shadow: var(--shadow-lg);
		padding: 12px;
		width: auto;
		min-width: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		animation: popover-appear 0.2s ease-out;

		&.above {
			animation: popover-appear-above 0.2s ease-out;
		}

		.fragments {
			position: relative;
			width: 48px;
			height: 48px;
		}

		.level {
			font-size: typography.$font-small;
			text-align: center;
			white-space: nowrap;
			display: flex;
			gap: spacing.$unit-half;
			color: var(--text-primary);

			.level-value {
				font-weight: typography.$medium;

				&.pending {
					color: var(--text-tertiary);
				}
			}
		}
	}

	@keyframes popover-appear {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes popover-appear-above {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
