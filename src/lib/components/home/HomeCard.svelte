<script lang="ts">
	/**
	 * The card that holds a home section's content (new items, rising teams).
	 */
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="card">
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: $page-corner;
		box-shadow: effects.$page-elevation;
		padding: $unit-2x $unit-2x calc($unit * 1.5);
		display: grid;
		gap: calc($unit * 1.5);

		@media (max-width: 768px) {
			padding: calc($unit * 1.5);
		}
	}
</style>
