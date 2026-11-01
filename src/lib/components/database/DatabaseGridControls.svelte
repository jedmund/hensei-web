<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		hasCustomColumns?: boolean
		leftActions?: Snippet
		headerActions?: Snippet
		rightActions?: Snippet
		onResetColumns?: () => void
	}

	const {
		hasCustomColumns = false,
		leftActions,
		headerActions,
		rightActions,
		onResetColumns
	}: Props = $props()
</script>

<div class="controls">
	{#if leftActions}
		{@render leftActions()}
	{/if}

	<div class="controls-right">
		{#if hasCustomColumns && onResetColumns}
			<Button variant="ghost" size="small" onclick={onResetColumns}>Reset columns</Button>
		{/if}

		{#if headerActions}
			{@render headerActions()}
		{/if}

		{#if rightActions}
			{@render rightActions()}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit-2x;
		gap: spacing.$unit;

		.controls-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			margin-left: auto;
		}
	}
</style>
