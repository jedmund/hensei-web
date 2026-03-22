
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import TranscendenceFragment from './TranscendenceFragment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { Popover } from 'bits-ui'
	import plusIcon from '$src/assets/icons/plus.svg?raw'
	import minusIcon from '$src/assets/icons/minus.svg?raw'

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

	let visibleStage = $state(stage)
	let currentStage = $state(stage)
	let prevStage = $state(stage)
	let immutable = $state(false)
	let isPopoverOpen = $state(false)

	const baseLevel = $derived(type === 'character' ? 100 : 200)
	const displayLevel = $derived(baseLevel + 10 * visibleStage)

	$effect(() => {
		if (stage !== prevStage) {
			prevStage = stage
			visibleStage = stage
			currentStage = stage
		}
	})

	function handleClick(event: MouseEvent) {
		if (editable && onStarClick) {
			// Prevent trigger from toggling the popover
			event.stopPropagation()
			onStarClick()
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

	function incrementStage() {
		if (currentStage < NUM_FRAGMENTS) {
			const newStage = currentStage + 1
			visibleStage = newStage
			currentStage = newStage
			if (onFragmentClick) {
				onFragmentClick(newStage)
			}
		}
	}

	function decrementStage() {
		if (currentStage > 0) {
			const newStage = currentStage - 1
			visibleStage = newStage
			currentStage = newStage
			if (onFragmentClick) {
				onFragmentClick(newStage)
			}
		}
	}
</script>

<Popover.Root bind:open={isPopoverOpen}>
	<Popover.Trigger disabled={!interactive}>
		{#snippet child({ props })}
			<div
				{...props}
				class="star TranscendenceStar"
				class:immutable
				class:empty={currentStage === 0}
				class:stage1={currentStage === 1}
				class:stage2={currentStage === 2}
				class:stage3={currentStage === 3}
				class:stage4={currentStage === 4}
				class:stage5={currentStage === 5}
				class:small={size === 'small'}
				onmouseleave={interactive ? handleMouseLeave : undefined}
				{tabindex}
				role={editable ? 'button' : undefined}
				aria-label={editable ? 'Transcendence star' : undefined}
			>
				<i class="figure {className || ''}" class:interactive class:base={className?.includes('base')} />
			</div>
		{/snippet}
	</Popover.Trigger>

	{#if interactive}
		<Popover.Portal>
			<Popover.Content
				class="transcendence-popover"
				side="bottom"
				sideOffset={8}
				align="center"
				avoidCollisions={true}
				collisionPadding={8}
				onOpenAutoFocus={(e) => e.preventDefault()}
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
				<div class="stage-controls">
					<Button
						variant="ghost"
						size="small"
						iconOnly
						shape="circular"
						onclick={decrementStage}
						disabled={currentStage <= 0}
					>
						{@html minusIcon}
					</Button>
					<Button
						variant="ghost"
						size="small"
						iconOnly
						shape="circular"
						onclick={incrementStage}
						disabled={currentStage >= NUM_FRAGMENTS}
					>
						{@html plusIcon}
					</Button>
				</div>
			</Popover.Content>
		</Popover.Portal>
	{/if}
</Popover.Root>

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

	:global(.transcendence-popover) {
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
		animation: transcendence-popover-appear 0.2s ease-out;
	}

	:global(.transcendence-popover .fragments) {
		position: relative;
		width: 48px;
		height: 48px;
		background-image: url('$src/assets/icons/transcendence/interactive/interactive-base.png');
		background-size: 48px 48px;
		background-repeat: no-repeat;
		background-position: center;
	}

	@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
		:global(.transcendence-popover .fragments) {
			background-image: url('$src/assets/icons/transcendence/interactive/interactive-base@2x.png');
		}
	}

	@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
		:global(.transcendence-popover .fragments) {
			background-image: url('$src/assets/icons/transcendence/interactive/interactive-base@3x.png');
		}
	}

	:global(.transcendence-popover .level) {
		font-size: typography.$font-small;
		text-align: center;
		white-space: nowrap;
		display: flex;
		gap: spacing.$unit-half;
		color: var(--text-primary);
	}

	:global(.transcendence-popover .level-value) {
		font-weight: typography.$medium;
	}

	:global(.transcendence-popover .level-value.pending) {
		color: var(--text-tertiary);
	}

	:global(.transcendence-popover .stage-controls) {
		display: flex;
		gap: spacing.$unit-half;
	}

	@keyframes transcendence-popover-appear {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
