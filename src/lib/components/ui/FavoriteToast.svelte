<script lang="ts">
	import Button from './Button.svelte'

	interface Props {
		message: string
		actionLabel?: string | undefined
		actionHref?: string | undefined
	}

	const { message, actionLabel, actionHref }: Props = $props()
</script>

<div class="favorite-toast">
	<p class="message">{message}</p>
	{#if actionLabel && actionHref}
		<Button variant="secondary" size="small" href={actionHref}>
			{actionLabel}
		</Button>
	{/if}
</div>

<style lang="scss">
	@use 'themes/spacing' as *;
	@use 'themes/typography' as *;

	.favorite-toast {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: calc($unit * 1.5) $unit-2x;
		background: var(--toast-bg);
		color: var(--toast-text);
		border: 1px solid var(--toast-border);
		border-radius: $unit;
		box-shadow: var(--shadow-lg);
	}

	.message {
		margin: 0;
		font-size: $font-body;
		line-height: 1.4;
	}
</style>
