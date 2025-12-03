<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		children: Snippet
		/** Message to show when section has no content */
		emptyMessage?: string
		/** Whether the section is empty (shows emptyMessage instead of children) */
		empty?: boolean
	}

	let { title, children, emptyMessage, empty = false }: Props = $props()
</script>

<div class="details-section">
	<h3>{title}</h3>
	{#if empty && emptyMessage}
		<p class="empty-message">{emptyMessage}</p>
	{:else}
		{@render children()}
	{/if}
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

		.empty-message {
			text-align: center;
			color: var(--text-secondary);
			font-size: typography.$font-small;
			padding: spacing.$unit-5x spacing.$unit;
			margin: 0;
		}
	}
</style>
