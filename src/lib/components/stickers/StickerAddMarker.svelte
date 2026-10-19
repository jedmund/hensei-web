<script lang="ts" module>
	/** The marker's size, which the picker opens against */
	export const ADD_MARKER_SIZE = 24
</script>

<script lang="ts">
	/**
	 * The (+) under the mouse over empty space in the sticker area, before the
	 * viewer has given a sticker: where one will go if they click. Colored by
	 * the area's --zone-bright (the team's element).
	 */
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** Centered here, relative to the area */
		left: number
		top: number
		/** Fades out (over a sticker, or off the area) rather than vanishing */
		shown: boolean
		/** Pressed down like a button while the mouse is */
		pressed: boolean
	}

	let { left, top, shown, pressed }: Props = $props()
</script>

<span
	class="add-marker"
	class:shown
	class:pressed
	style:left="{left}px"
	style:top="{top}px"
	style:--size="{ADD_MARKER_SIZE}px"
	aria-hidden="true"
>
	<Icon name="plus" size={12} />
</span>

<style lang="scss">
	@use '$src/themes/badge' as badge;

	.add-marker {
		position: absolute;
		z-index: 3;
		margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
		@include badge.round-badge(var(--size));
		background: var(--zone-bright, var(--zone-accent));
		pointer-events: none;
		opacity: 0;
		scale: 0.8;
		transition:
			opacity 0.15s ease,
			scale 0.15s ease;

		&.shown {
			opacity: 1;
			scale: 1;
		}

		&.shown.pressed {
			scale: 0.95;
			transition-duration: 0.08s;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}
</style>
