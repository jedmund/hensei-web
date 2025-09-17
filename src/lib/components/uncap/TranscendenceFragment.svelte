<svelte:options runes={true} />

<script lang="ts">
	interface Props {
		stage: number
		interactive?: boolean
		visible?: boolean
		onClick?: (index: number) => void
		onHover?: (index: number) => void
	}

	let {
		stage,
		interactive = false,
		visible = false,
		onClick,
		onHover
	}: Props = $props()

	function handleClick() {
		if (interactive && onClick) {
			onClick(stage)
		}
	}

	function handleHover() {
		if (interactive && onHover) {
			onHover(stage)
		}
	}
</script>

<i
	class="fragment"
	class:visible
	class:stage1={stage === 1}
	class:stage2={stage === 2}
	class:stage3={stage === 3}
	class:stage4={stage === 4}
	class:stage5={stage === 5}
	onclick={handleClick}
	onmouseover={handleHover}
	role={interactive ? 'button' : undefined}
	aria-label={interactive ? `Transcendence fragment ${stage}` : undefined}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.fragment {
		--degrees: 72deg;
		--orig-width: 29px;
		--orig-height: 54px;
		--scaled-width: 12px;
		--scaled-height: calc((var(--scaled-width) / var(--orig-width)) * var(--orig-height));
		--scale: 1.2;

		background-image: url('/icons/transcendence/interactive/interactive-piece.png');
		background-size: var(--scaled-width) var(--scaled-height);
		background-repeat: no-repeat;

		position: absolute;
		z-index: 32;

		aspect-ratio: 29 / 54;
		height: var(--scaled-height);
		width: var(--scaled-width);
		opacity: 0;

		&:hover {
			cursor: pointer;
		}

		&.visible {
			opacity: 1;
		}

		&.stage1 {
			top: 3px;
			left: 18px;
		}

		&.stage2 {
			top: 10px;
			left: 27px;
			transform: rotate(var(--degrees));
		}

		&.stage3 {
			top: 21px;
			left: 24px;
			transform: rotate(calc(var(--degrees) * 2));
		}

		&.stage4 {
			top: 21px;
			left: 12px;
			transform: rotate(calc(var(--degrees) * 3));
		}

		&.stage5 {
			top: 10px;
			left: 8px;
			transform: rotate(calc(var(--degrees) * 4));
		}

		/* High DPI support */
		@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
			background-image: url('/icons/transcendence/interactive/interactive-piece@2x.png');
		}

		@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
			background-image: url('/icons/transcendence/interactive/interactive-piece@3x.png');
		}
	}
</style>