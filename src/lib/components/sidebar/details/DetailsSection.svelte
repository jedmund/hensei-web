<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		children: Snippet
		/** Optional action rendered at the right side of the section header */
		action?: Snippet
		/** Optional description rendered below children inside the same section */
		description?: Snippet
		/** Message to show when section has no content */
		emptyMessage?: string
		/** Whether the section is empty (shows emptyMessage instead of children) */
		empty?: boolean
	}

	let { title, children, action, description, emptyMessage, empty = false }: Props = $props()
</script>

<div class="details-section">
	<div class="header">
		<h3>{title}</h3>
		{#if action}
			{@render action()}
		{/if}
	</div>
	{#if empty && emptyMessage}
		<p class="empty-message">{emptyMessage}</p>
	{:else}
		{@render children()}
		{#if description}
			<div class="description">
				{@render description()}
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-section {
		display: flex;
		flex-direction: column;
		gap: calc(spacing.$unit * 1.5);
		padding: 0 spacing.$unit;

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 spacing.$unit;
		}

		h3 {
			margin: 0;
			font-size: typography.$font-name;
			font-weight: typography.$medium;
			color: var(--text-primary);
		}

		.empty-message {
			text-align: center;
			color: var(--text-secondary);
			font-size: typography.$font-small;
			padding: spacing.$unit-5x spacing.$unit;
			margin: 0;
		}

		.description {
			padding: 0 spacing.$unit;
		}
	}
</style>
