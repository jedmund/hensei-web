<script lang="ts">
	/**
	 * The card that holds a home section: its title, then its content (events,
	 * new items, rising teams, staff picks).
	 */
	import type { Snippet } from 'svelte'

	interface Props {
		title?: string
		children: Snippet
	}

	let { title, children }: Props = $props()
</script>

<div class="card">
	{#if title}
		<h2 class="title">{title}</h2>
	{/if}
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/typography' as *;

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

	.title {
		margin: 0;
		font-size: $font-medium;
		font-weight: $bold;
		color: var(--text-primary);
	}
</style>
