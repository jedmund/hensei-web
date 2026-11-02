<script lang="ts">
	/**
	 * The cover art at the top of a home card (an event's banner, a battle's
	 * banner). The frame stays the same size whatever the art, so switching
	 * doesn't jump; art of another shape fills it, cropped around the centre.
	 * Without art, or if it fails to load, `placeholder` fills the frame.
	 * `frame` puts art with transparent edges on an element's muted cover tone
	 * (`--{element}-cover-bg`; 'null' for plain grey).
	 */
	import type { Snippet } from 'svelte'
	import type { ElementKeyResult } from '$lib/utils/element'

	interface Props {
		src: string | null | undefined
		/** Shown over the art, e.g. pills along the bottom */
		children?: Snippet
		placeholder?: Snippet
		frame?: ElementKeyResult
		/**
		 * Art pixels cropped off the top and the bottom each. The frame then
		 * takes the art's own width-to-height ratio minus those rows, so only
		 * the top and bottom are cut.
		 */
		trim?: number
	}

	let { src, children, placeholder, frame, trim = 0 }: Props = $props()

	let failed = $state(false)
	// The art's natural size, once loaded (battle banners are 588×256)
	let natural = $state({ width: 588, height: 256 })
	$effect(() => {
		// A new image gets a fresh chance to load
		void src
		failed = false
	})

	const aspectRatio = $derived(
		trim ? `${natural.width} / ${Math.max(natural.height - trim * 2, 1)}` : undefined
	)
</script>

<div
	class="cover"
	style:aspect-ratio={aspectRatio}
	style:background={frame && src && !failed ? `var(--${frame}-cover-bg)` : undefined}
>
	{#if src && !failed}
		<img
			{src}
			alt=""
			loading="lazy"
			onload={(e) => {
				const img = e.currentTarget as HTMLImageElement
				natural = { width: img.naturalWidth, height: img.naturalHeight }
			}}
			onerror={() => (failed = true)}
		/>
	{:else}
		{@render placeholder?.()}
	{/if}
	{@render children?.()}
</div>

<style lang="scss">
	@use '$src/themes/layout' as *;

	.cover {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 640 / 300;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--background);

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
</style>
