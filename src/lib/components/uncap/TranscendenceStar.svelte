<svelte:options runes={true} />

<script lang="ts">
	import TranscendenceFragment from './TranscendenceFragment.svelte'

	interface Props {
		className?: string
		stage?: number
		editable?: boolean
		interactive?: boolean
		tabIndex?: number
		onStarClick?: () => void
		onFragmentClick?: (newStage: number) => void
		onFragmentHover?: (newStage: number) => void
	}

	let {
		className,
		stage = 0,
		editable = false,
		interactive = false,
		tabIndex,
		onStarClick,
		onFragmentClick,
		onFragmentHover
	}: Props = $props()

	const NUM_FRAGMENTS = 5

	let visibleStage = $state(stage)
	let currentStage = $state(stage)
	let immutable = $state(false)
	let starElement: HTMLDivElement

	$effect(() => {
		visibleStage = stage
		currentStage = stage
	})

	function handleClick() {
		if (editable && onStarClick) {
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
	onclick={handleClick}
	onmouseleave={interactive ? handleMouseLeave : undefined}
	bind:this={starElement}
	{tabIndex}
	role={editable ? 'button' : undefined}
	aria-label={editable ? 'Transcendence star' : undefined}
>
	<div class="fragments">
		{#if interactive}
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
		{/if}
	</div>
	<i class="figure {className || ''}" class:interactive class:base={className?.includes('base')} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.star {
		--size: 18px;
		position: relative;
		cursor: pointer;

		&:hover {
			transform: scale(1.2);
		}

		&.immutable {
			pointer-events: none;
		}

		&.empty {
			background-image: url('/icons/transcendence/0/stage-0.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage1 {
			background-image: url('/icons/transcendence/1/stage-1.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage2 {
			background-image: url('/icons/transcendence/2/stage-2.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage3 {
			background-image: url('/icons/transcendence/3/stage-3.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage4 {
			background-image: url('/icons/transcendence/4/stage-4.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		&.stage5 {
			background-image: url('/icons/transcendence/5/stage-5.png');
			background-size: var(--size) var(--size);
			background-repeat: no-repeat;
		}

		/* High DPI support */
		@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
			&.empty {
				background-image: url('/icons/transcendence/0/stage-0@2x.png');
			}
			&.stage1 {
				background-image: url('/icons/transcendence/1/stage-1@2x.png');
			}
			&.stage2 {
				background-image: url('/icons/transcendence/2/stage-2@2x.png');
			}
			&.stage3 {
				background-image: url('/icons/transcendence/3/stage-3@2x.png');
			}
			&.stage4 {
				background-image: url('/icons/transcendence/4/stage-4@2x.png');
			}
			&.stage5 {
				background-image: url('/icons/transcendence/5/stage-5@2x.png');
			}
		}

		@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
			&.empty {
				background-image: url('/icons/transcendence/0/stage-0@3x.png');
			}
			&.stage1 {
				background-image: url('/icons/transcendence/1/stage-1@3x.png');
			}
			&.stage2 {
				background-image: url('/icons/transcendence/2/stage-2@3x.png');
			}
			&.stage3 {
				background-image: url('/icons/transcendence/3/stage-3@3x.png');
			}
			&.stage4 {
				background-image: url('/icons/transcendence/4/stage-4@3x.png');
			}
			&.stage5 {
				background-image: url('/icons/transcendence/5/stage-5@3x.png');
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
				background-image: url('/icons/transcendence/interactive/interactive-base.png');
				background-size: var(--size) var(--size);
				height: var(--size);
				width: var(--size);

				&:hover {
					cursor: pointer;
					transform: none;
				}

				/* High DPI support */
				@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
					background-image: url('/icons/transcendence/interactive/interactive-base@2x.png');
				}

				@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
					background-image: url('/icons/transcendence/interactive/interactive-base@3x.png');
				}
			}

			&:hover {
				transform: scale(1.2);
			}
		}
	}
</style>