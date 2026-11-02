<script lang="ts">
	/**
	 * The card that holds a home section: its title, then its content (events,
	 * new items, rising teams, staff picks).
	 */
	import type { Snippet } from 'svelte'

	interface Props {
		title?: string
		/** A short line under the title */
		subtitle?: string
		children: Snippet
	}

	let { title, subtitle, children }: Props = $props()
</script>

<div class="card">
	{#if title && subtitle}
		<header class="heading">
			<h2 class="title">{title}</h2>
			<p class="subtitle">{subtitle}</p>
		</header>
	{:else if title}
		<h2 class="title">{title}</h2>
	{/if}
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.card {
		@include page-surface;
		padding: $unit-2x $unit-2x calc($unit * 1.5);
		display: grid;
		// Content never widens the card past its column (long names, wide pickers)
		grid-template-columns: minmax(0, 1fr);
		gap: calc($unit * 1.5);

		@media (max-width: 768px) {
			padding: calc($unit * 1.5);
		}
	}

	.heading {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.subtitle {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.title {
		margin: 0;
		font-size: $font-medium;
		font-weight: $bold;
		color: var(--text-primary);
	}
</style>
