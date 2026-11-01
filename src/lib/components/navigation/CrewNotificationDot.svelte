<script lang="ts">
	import type { NavElement } from './navigationState.svelte'

	interface Props {
		element?: NavElement | undefined
	}

	const { element }: Props = $props()
</script>

<span class="crew-notification-dot {element ?? ''}"></span>

<style lang="scss">
	$elements: wind, fire, water, earth, dark, light;

	.crew-notification-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--button-primary-bg);
		animation: notification-pulse 2s ease-in-out infinite;
		flex-shrink: 0;
	}

	@each $el in $elements {
		.crew-notification-dot.#{$el} {
			background: var(--#{$el}-button-bg);
		}
	}

	@keyframes notification-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
