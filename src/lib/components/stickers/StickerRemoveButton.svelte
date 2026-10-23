<script lang="ts">
	/**
	 * The (x) over the top right of the viewer's own sticker that takes it
	 * back: white on off-black, so it stands out against the art. Its parent
	 * positions it (relative) and decides when it shows.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		onclick: () => void
	}

	let { onclick }: Props = $props()
</script>

<button
	type="button"
	class="sticker-remove"
	aria-label={m.sticker_take_back()}
	onpointerdown={(e) => e.stopPropagation()}
	{onclick}
>
	<Icon name="close" size={10} />
</button>

<style lang="scss">
	@use '$src/themes/badge' as badge;

	.sticker-remove {
		position: absolute;
		top: -2px;
		right: -2px;
		z-index: 1;
		@include badge.round-badge(20px);
		background: #1a1a1a;
		cursor: pointer;
		transition:
			opacity 0.2s ease,
			transform 0.15s ease;

		&:hover {
			transform: scale(1.1);
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}
</style>
