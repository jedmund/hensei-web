<svelte:options runes={true} />

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Page title (not the item name) */
		title: string
		/** Custom right action content */
		rightAction?: Snippet | undefined
		/** URL to navigate to when back is clicked */
		backHref: string
	}

	let { title, rightAction, backHref }: Props = $props()
</script>

<header class="header">
	<div class="left">
		<Button variant="ghost" size="small" leftIcon="chevron-left" href={backHref}>
			Back
		</Button>
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
