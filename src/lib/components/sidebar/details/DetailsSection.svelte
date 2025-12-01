<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		children: Snippet
	}

	let { title, children }: Props = $props()
</script>

<div class="details-section">
	<h3>{title}</h3>
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-section {
		padding: 0 spacing.$unit;

		h3 {
			margin: 0 0 calc(spacing.$unit * 1.5) 0;
			font-size: typography.$font-name;
			font-weight: typography.$medium;
			color: var(--text-primary);
			padding: 0 spacing.$unit;
		}
	}
</style>
