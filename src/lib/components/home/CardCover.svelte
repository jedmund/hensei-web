<script lang="ts">
	/**
	 * The cover art at the top of a home card (an event's banner, a battle's
	 * banner). The frame stays the same size whatever the art, so switching
	 * doesn't jump; art of another shape fills it, cropped around the centre.
	 * Without art, or if it fails to load, `placeholder` fills the frame.
	 * `dark` puts art with transparent edges on a mid-grey frame.
	 */
	import type { Snippet } from 'svelte'

	interface Props {
		src: string | null | undefined
		/** Shown over the art, e.g. pills along the bottom */
		children?: Snippet
		placeholder?: Snippet
		dark?: boolean
	}

	let { src, children, placeholder, dark = false }: Props = $props()

	let failed = $state(false)
	$effect(() => {
		// A new image gets a fresh chance to load
		void src
		failed = false
	})
</script>

<div class="cover" class:dark={dark && src && !failed}>
	{#if src && !failed}
		<img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
	{:else}
		{@render placeholder?.()}
	{/if}
	{@render children?.()}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
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

		&.dark {
			background: colors.$grey-50;
		}
	}
</style>
