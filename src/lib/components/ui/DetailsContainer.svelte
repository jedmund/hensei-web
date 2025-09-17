<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	let { title, children }: { title: string; children: Snippet } = $props()
</script>

<div class="container">
	<h4>{title}</h4>
	<div class="details">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.container {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid #e5e5e5;

		&:last-child {
			border-bottom: none;
		}

		h4 {
			color: colors.$grey-30;
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.details {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit;
		}
	}
</style>
