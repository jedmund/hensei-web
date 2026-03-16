
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		leftAction?: Snippet | undefined
		rightAction?: Snippet | undefined
	}

	let { title, leftAction, rightAction }: Props = $props()
</script>

<header class="header">
	<div class="left">
		{#if leftAction}
			{@render leftAction()}
		{/if}
	</div>

	<h1 class="title">{title}</h1>

	<div class="right">
		{#if rightAction}
			{@render rightAction()}
		{/if}
	</div>
</header>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit-2x;
		gap: spacing.$unit-2x;
	}

	.left,
	.right {
		flex: 1;
		min-width: 0;
	}

	.right {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
	}

	.title {
		flex: 1;
		text-align: center;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0;
	}
</style>
