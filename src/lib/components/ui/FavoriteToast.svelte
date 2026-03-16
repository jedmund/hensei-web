<script lang="ts">
	import Button from './Button.svelte'
	import Icon from '../Icon.svelte'

	interface Props {
		partyName: string
		message: string
		icon?: string | undefined
		actionLabel?: string | undefined
		actionHref?: string | undefined
	}

	const { partyName, message, icon = 'favorite', actionLabel, actionHref }: Props = $props()

	const nameIndex = $derived(message.indexOf(partyName))
	const beforeName = $derived(nameIndex >= 0 ? message.slice(0, nameIndex) : '')
	const afterName = $derived(nameIndex >= 0 ? message.slice(nameIndex + partyName.length) : message)
</script>

<div class="favorite-toast">
	<div class="content">
		<span class="toast-icon">
			<Icon name={icon} size={18} />
		</span>
		<p class="message">{#if nameIndex >= 0}{beforeName}<span class="party-name">{partyName}</span>{afterName}{:else}{message}{/if}</p>
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
		gap: $unit;
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
		gap: $unit;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.message {
		margin: 0;
		font-size: $font-body;
		line-height: 1.4;
	}

	.party-name {
		font-weight: $medium;
	}

	.action {
		display: flex;
		justify-content: flex-end;
	}
</style>
