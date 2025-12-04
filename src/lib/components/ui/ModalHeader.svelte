<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		description?: string
		children?: Snippet
	}

	let { title, description, children }: Props = $props()
</script>

<div class="modal-header">
	<div class="header-text">
		<h2 class="title">{title}</h2>
		{#if description}
			<p class="description">{description}</p>
		{/if}
	</div>
	{#if children}
		{@render children()}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.modal-header {
		padding: spacing.$unit-2x;
		padding-bottom: spacing.$unit;
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.title {
		font-size: typography.$font-large;
		font-weight: typography.$bold;
		margin: 0;
		color: var(--text-primary);
	}

	.description {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
	}
</style>
