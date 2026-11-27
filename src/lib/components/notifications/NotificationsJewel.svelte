<script lang="ts">
	/**
	 * The bell in the desktop nav pill (GBF-82). Its badge is the unread count;
	 * opening it shows the latest notifications and clears the badge (rows stay
	 * unread until clicked). "View all" opens the side pane.
	 */
	import { Popover } from 'bits-ui'
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import { notificationQueries } from '$lib/api/queries/notification.queries'
	import { useMarkNotificationsSeen } from '$lib/api/mutations/notification.mutations'
	import Icon from '$lib/components/Icon.svelte'
	import NotificationBadge from '$lib/components/ui/NotificationBadge.svelte'
	import type { NavElement } from '$lib/components/navigation/navigationState.svelte'
	import NotificationList from './NotificationList.svelte'
	import { openNotificationsPane } from './openNotificationsPane'

	interface Props {
		unreadCount: number
		element?: NavElement | undefined
	}

	const { unreadCount, element }: Props = $props()

	let open = $state(false)

	const recent = createQuery(() => ({ ...notificationQueries.recent(), enabled: open }))
	const markSeen = useMarkNotificationsSeen()

	function handleOpenChange(next: boolean) {
		open = next
		if (next) {
			recent.refetch()
			if (unreadCount > 0) markSeen.mutate()
		}
	}

	function viewAll() {
		open = false
		openNotificationsPane()
	}
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
	<Popover.Trigger
		class="nav-jewel-trigger"
		aria-label={unreadCount > 0
			? m.notifications_jewel_aria_unread({ count: unreadCount })
			: m.notifications_jewel_aria()}
	>
		<Icon name="bell" size={16} />
		{#if unreadCount > 0}
			<span class="jewel-badge">
				<NotificationBadge count={unreadCount} showCount {element} />
			</span>
		{/if}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			class="notifications-popover"
			side="bottom"
			align="end"
			sideOffset={8}
			collisionPadding={16}
		>
			<header class="popover-header">
				<h2>{m.nav_notifications()}</h2>
			</header>
			<div class="popover-body">
				<NotificationList
					notifications={recent.data?.notifications ?? []}
					isLoading={recent.isLoading}
					isError={recent.isError}
					onNavigate={() => (open = false)}
				/>
			</div>
			<footer class="popover-footer">
				<button type="button" class="view-all" onclick={viewAll}>
					{m.notifications_view_all()}
				</button>
			</footer>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	// Mirrors .nav-search-trigger / .nav-more-trigger
	:global(.nav-jewel-trigger) {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		padding: spacing.$unit calc(spacing.$unit * 1.5 + 1px);
		border-radius: layout.$full-corner;
		background-color: transparent;
		color: var(--menu-text);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}

	:global(.nav-jewel-trigger[data-state='open']) {
		background-color: var(--menu-bg-item-hover);
	}

	.jewel-badge {
		position: absolute;
		top: 2px;
		right: 4px;
		display: flex;
		pointer-events: none;
	}

	:global(.notifications-popover) {
		@include dropdown.dropdown-content;
		display: flex;
		flex-direction: column;
		width: min(380px, calc(100vw - spacing.$unit-4x));
		max-height: min(560px, calc(100vh - 120px));
		padding: 0;
		overflow: hidden;
	}

	.popover-header {
		padding: spacing.$unit-2x spacing.$unit-2x spacing.$unit;

		h2 {
			margin: 0;
			font-size: typography.$font-regular;
			font-weight: typography.$bold;
			color: var(--text-primary);
		}
	}

	.popover-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0 spacing.$unit-half;
	}

	.popover-footer {
		border-top: 1px solid var(--menu-border, rgba(0, 0, 0, 0.1));
		padding: spacing.$unit-half;
	}

	.view-all {
		width: 100%;
		padding: spacing.$unit;
		border: none;
		border-radius: layout.$item-corner;
		background: transparent;
		color: var(--text-primary);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		cursor: pointer;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}
</style>
