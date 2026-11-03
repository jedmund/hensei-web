<script lang="ts">
	/**
	 * The pickers at the top of a home card (events and raids, new items).
	 *
	 * On phones these used to stick to the top like a list header while the
	 * card scrolled. That's turned off for now: in iOS Safari 26+, once a
	 * sticky element with a background reaches the top edge, Safari draws
	 * solid bars behind its status bar and toolbar for the rest of the page,
	 * even after moving the background to a pseudo-element. To bring it back,
	 * see this file's history (the `stuck` tracking and the mobile
	 * `position: sticky` block) and test on an iPhone.
	 */
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="pinned">
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.pinned {
		display: grid;
		gap: calc($unit * 1.5);

		&:empty {
			display: none;
		}
	}
</style>
