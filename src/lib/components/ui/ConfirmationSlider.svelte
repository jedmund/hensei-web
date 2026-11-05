<script lang="ts">
	/**
	 * Slide-to-confirm: the user drags the handle to the end of the rail to
	 * accept, like a phone's slide-to-answer. Letting go before the end springs
	 * back. From the keyboard, the arrow keys move the handle and Enter, Space
	 * or End confirm. Takes the surrounding text color, so it fits any notice.
	 */
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** Shown in the rail, e.g. "I understand" */
		label: string
		/** Set once the handle reaches the end; stays set */
		confirmed?: boolean
		/**
		 * Called when the handle reaches the end. Return false to refuse: the
		 * handle springs back and the slider can be tried again.
		 */
		onConfirm?: () => boolean | void
		disabled?: boolean
		/** How far along the handle is, 0 to 1; bind to follow the slide */
		progress?: number
	}

	let {
		label,
		confirmed = $bindable(false),
		onConfirm,
		disabled = false,
		progress = $bindable(0)
	}: Props = $props()

	/** How far along the rail the handle must be let go to confirm */
	const THRESHOLD = 0.9
	const KEY_STEP = 0.25

	let dragging = $state(false)
	let rail: HTMLDivElement | undefined = $state()
	let dragStartX = 0
	let dragStartProgress = 0
	// How far the handle can move, in pixels; measured when a drag starts
	let travel = 1
	const shown = $derived(confirmed ? 1 : progress)
	const locked = $derived(disabled || confirmed)

	function confirm() {
		if (confirmed) return
		if (onConfirm?.() === false) {
			progress = 0
			return
		}
		progress = 1
		confirmed = true
	}

	function onpointerdown(e: PointerEvent) {
		if (locked || e.button !== 0) return
		const handle = e.currentTarget as HTMLElement
		handle.setPointerCapture(e.pointerId)
		// The handle sits the same distance from the top as from either end
		const inset = handle.offsetTop
		travel = Math.max((rail?.clientWidth ?? 0) - handle.offsetWidth - inset * 2, 1)
		dragging = true
		dragStartX = e.clientX
		dragStartProgress = progress
	}

	function onpointermove(e: PointerEvent) {
		if (!dragging) return
		const next = dragStartProgress + (e.clientX - dragStartX) / travel
		progress = Math.min(Math.max(next, 0), 1)
	}

	function onpointerup() {
		if (!dragging) return
		dragging = false
		if (progress >= THRESHOLD) confirm()
		else progress = 0
	}

	function onkeydown(e: KeyboardEvent) {
		if (locked) return
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				progress = Math.min(progress + KEY_STEP, 1)
				if (progress >= 1) confirm()
				break
			case 'ArrowLeft':
			case 'ArrowDown':
				progress = Math.max(progress - KEY_STEP, 0)
				break
			case 'Home':
				progress = 0
				break
			case 'End':
			case 'Enter':
			case ' ':
				confirm()
				break
			default:
				return
		}
		e.preventDefault()
	}
</script>

<div
	class="confirmation-slider"
	class:dragging
	class:confirmed
	class:disabled
	style:--progress={shown}
	bind:this={rail}
>
	<span class="label" style:opacity={confirmed ? 1 : Math.max(1 - shown * 1.6, 0)}>
		<span class="label-text">{label}</span>
	</span>
	<div
		class="handle"
		role="slider"
		tabindex={locked ? -1 : 0}
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(shown * 100)}
		aria-disabled={locked}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		onpointercancel={onpointerup}
		{onkeydown}
	>
		<Icon name={confirmed ? 'check' : 'arrow-right'} size={20} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	$inset: 4px;
	$height: 52px;
	$handle-width: 64px;

	.confirmation-slider {
		position: relative;
		width: 100%;
		height: $height;
		border-radius: $card-corner;
		background: color-mix(in srgb, currentColor 16%, transparent);
		user-select: none;
		-webkit-user-select: none;

		&.disabled {
			opacity: 0.5;
		}
	}

	.label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		// The same on both sides, so the text centers on the whole rail while
		// staying clear of the handle at rest
		padding: 0 calc(#{$handle-width} + #{$inset * 2});
		font-size: $font-regular;
		font-weight: $bold;
		letter-spacing: 0.02em;
		pointer-events: none;
	}

	// A soft iridescent sheen sweeping left to right: where to slide
	.label-text {
		background-image: linear-gradient(
			90deg,
			currentColor 0%,
			currentColor 32%,
			color-mix(in oklch, currentColor 70%, #ff7ae6) 42%,
			color-mix(in oklch, currentColor 62%, #ffe96b) 50%,
			color-mix(in oklch, currentColor 70%, #4fe3ff) 58%,
			currentColor 68%,
			currentColor 100%
		);
		background-size: 250% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		// Hide the fill, not the color: the gradient's currentColor reads color
		-webkit-text-fill-color: transparent;
		animation: sheen 2.8s linear infinite;

		@media (prefers-reduced-motion: reduce) {
			animation: none;
			background-image: none;
			-webkit-text-fill-color: currentColor;
		}
	}

	.confirmed .label-text,
	.disabled .label-text {
		animation: none;
		background-image: none;
		-webkit-text-fill-color: currentColor;
	}

	@keyframes sheen {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: 0% 0;
		}
	}

	.handle {
		position: absolute;
		top: $inset;
		// Slides from the left inset to the right one as --progress goes 0 → 1
		left: calc(#{$inset} + var(--progress) * (100% - #{$handle-width} - #{$inset * 2}));
		width: $handle-width;
		height: $height - $inset * 2;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: $item-corner;
		background: currentColor;
		cursor: grab;
		// The drag is horizontal; don't let the dialog scroll take it
		touch-action: none;
		transition: left 0.25s cubic-bezier(0.3, 1.3, 0.5, 1);

		:global(svg) {
			color: var(--card-bg);
		}

		&:focus-visible {
			outline: 2px solid currentColor;
			outline-offset: 2px;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	.dragging .handle {
		cursor: grabbing;
		transition: none;
	}

	.confirmed .handle,
	.disabled .handle {
		cursor: default;
	}
</style>
