<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		title,
		action,
		children
	}: {
		title: string
		/** Shown opposite the title, e.g. an Add button */
		action?: Snippet | undefined
		children: Snippet
	} = $props()
</script>

<div class="container">
	<header>
		<h4>{title}</h4>
		{@render action?.()}
	</header>
	<div class="details">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.container {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-subtle);

		&:last-child {
			border-bottom: none;
		}

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: spacing.$unit;
		}

		h4 {
			color: var(--text-primary);
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			margin: 0;
		}

		.details {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit;
		}
	}
</style>
