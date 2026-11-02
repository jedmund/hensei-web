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
		 * Art pixels cropped off each side (x) and off the top and bottom (y).
		 * The frame takes the shape of what's left, so nothing else is cut.
		 */
		trim?: { x: number; y: number }
	}

	let { src, children, placeholder, frame, trim }: Props = $props()

	let failed = $state(false)
	// The art's natural size, once loaded (battle banners are 588×256)
	let natural = $state({ width: 588, height: 256 })
	$effect(() => {
		// A new image gets a fresh chance to load
		void src
		failed = false
	})

	// The art's visible size, and how far it overhangs the frame on each edge
	const crop = $derived.by(() => {
		if (!trim) return null
		const width = Math.max(natural.width - trim.x * 2, 1)
		const height = Math.max(natural.height - trim.y * 2, 1)
		return {
			aspectRatio: `${width} / ${height}`,
			width: `${(natural.width / width) * 100}%`,
			height: `${(natural.height / height) * 100}%`,
			left: `${(-trim.x / width) * 100}%`,
			top: `${(-trim.y / height) * 100}%`
		}
	})
</script>

<div
	class="cover"
	style:aspect-ratio={crop?.aspectRatio}
	style:background={frame && src && !failed ? `var(--${frame}-cover-bg)` : undefined}
>
	{#if src && !failed}
		<img
			{src}
			alt=""
			loading="lazy"
			class:trimmed={crop}
			style:width={crop?.width}
			style:height={crop?.height}
			style:left={crop?.left}
			style:top={crop?.top}
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

			&.trimmed {
				position: absolute;
				max-width: none;
			}
		}
	}
</style>
