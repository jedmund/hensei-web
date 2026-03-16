<script lang="ts">
	import Button from './Button.svelte'
	import Icon from '../Icon.svelte'

	interface Props {
		message: string
		actionLabel?: string | undefined
		actionHref?: string | undefined
	}

	const { message, actionLabel, actionHref }: Props = $props()
</script>

<div class="favorite-toast">
	<div class="content">
		<span class="check-icon">
			<Icon name="check" size={14} />
		</span>
		<p class="message">{message}</p>
	</div>
	{#if actionLabel && actionHref}
		<div class="action">
			<Button variant="secondary" size="small" href={actionHref}>
				{actionLabel}
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'themes/spacing' as *;
	@use 'themes/typography' as *;
	@use 'themes/layout' as *;

	.favorite-toast {
		display: flex;
		flex-direction: column;
		gap: calc($unit * 1.5);
		padding: calc($unit * 1.5) $unit-2x;
		background: var(--toast-bg);
		color: var(--toast-text);
		border: 1px solid var(--toast-border);
		border-radius: $card-corner;
		box-shadow: var(--shadow-lg);
		font-family: var(--font-family);
	}

	.content {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: calc($unit * 1.5);
	}

	.check-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--toast-success-text);
		margin-top: 2px;
	}

	.message {
		margin: 0;
		font-size: $font-body;
		line-height: 1.4;
	}

	.action {
		display: flex;
		justify-content: flex-end;
	}
</style>
