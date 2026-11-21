<script lang="ts">
	/**
	 * WonderImage - a Wonder's 130×130 art from the `wonders/` bucket prefix,
	 * dimmed when the Wonder is turned off in game.
	 */
	import { getWonderImage } from '$lib/utils/images/wonders'

	interface Props {
		/** The API's `image` (e.g. `9008_20`) */
		image: string
		alt?: string
		/** Display size in px */
		size?: number
		inactive?: boolean
	}

	let { image, alt = '', size = 64, inactive = false }: Props = $props()
</script>

<img
	class="wonder-image"
	class:inactive
	src={getWonderImage(image)}
	{alt}
	width={size}
	height={size}
	loading="lazy"
	style:--wonder-size={`${size}px`}
/>

<style lang="scss">
	@use '$src/themes/layout' as *;

	.wonder-image {
		display: block;
		width: var(--wonder-size);
		height: var(--wonder-size);
		flex-shrink: 0;
		border-radius: $item-corner;
		background: var(--button-bg);
		object-fit: cover;

		&.inactive {
			opacity: 0.4;
			filter: grayscale(0.6);
		}
	}
</style>
