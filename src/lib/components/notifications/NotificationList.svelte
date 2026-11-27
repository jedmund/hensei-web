<script lang="ts">
	/** Notification rows with their loading, error and empty states */
	import { m } from '$lib/paraglide/messages'
	import Icon from '$lib/components/Icon.svelte'
	import type { AppNotification } from '$lib/types/api/notification'
	import NotificationRow from './NotificationRow.svelte'

	interface Props {
		notifications: AppNotification[]
		isLoading?: boolean
		isError?: boolean
		onNavigate?: () => void
	}

	const { notifications, isLoading = false, isError = false, onNavigate }: Props = $props()
</script>

{#if isLoading && notifications.length === 0}
	<div class="list-state loading">
		<Icon name="loader-2" size={20} />
	</div>
{:else if isError && notifications.length === 0}
	<div class="list-state">
		<p>{m.notifications_load_failed()}</p>
	</div>
{:else if notifications.length === 0}
	<div class="list-state">
		<Icon name="bell" size={24} />
		<p>{m.notifications_empty()}</p>
		<p class="hint">{m.notifications_empty_hint()}</p>
	</div>
{:else}
	<ul class="notification-list" role="list">
		{#each notifications as notification (notification.id)}
			<li><NotificationRow {notification} {onNavigate} /></li>
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.notification-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.list-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-4x spacing.$unit-2x;
		color: var(--text-secondary);
		text-align: center;
		font-size: typography.$font-small;

		p {
			margin: 0;
		}

		.hint {
			font-size: typography.$font-tiny;
			color: var(--text-tertiary);
		}

		&.loading :global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
