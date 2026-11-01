<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		message: string
		/**
		 * status: loading/error message, centred, with room for an action below
		 * notice: centred message with an optional muted hint line
		 * empty: a single line of centred text
		 */
		variant?: 'status' | 'notice' | 'empty'
		/** Secondary line, notice variant only */
		hint?: string | undefined
		/** Element for the empty variant (pages differ in whether it's a paragraph) */
		as?: 'p' | 'div'
		/** Content below the message (e.g. a back button), status variant only */
		children?: Snippet
	}

	const { message, variant = 'status', hint, as = 'div', children }: Props = $props()
</script>

{#if variant === 'empty'}
	<svelte:element this={as} class="empty">{message}</svelte:element>
{:else if variant === 'notice'}
	<div class="notice">
		<p>{message}</p>
		{#if hint}
			<p class="hint">{hint}</p>
		{/if}
	</div>
{:else}
	<div class="status">
		<p>{message}</p>
		{@render children?.()}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.status {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: spacing.$unit-4x;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.notice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
		font-size: typography.$font-small;

		p {
			margin: 0;
		}

		.hint {
			color: var(--text-tertiary);
		}
	}

	.empty {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}
</style>
