<script lang="ts">
	/** Every notification, a page at a time: the jewel's "View all" (GBF-82) */
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { m } from '$lib/paraglide/messages'
	import { notificationQueries } from '$lib/api/queries/notification.queries'
	import { useMarkAllNotificationsRead } from '$lib/api/mutations/notification.mutations'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import NotificationList from './NotificationList.svelte'

	const feed = createInfiniteQuery(() => notificationQueries.feed())
	const markAllRead = useMarkAllNotificationsRead()

	const notifications = $derived(feed.data?.pages.flatMap((page) => page.notifications) ?? [])
	const hasUnread = $derived(notifications.some((n) => !n.read))

	let sentinelEl = $state<HTMLElement>()
	const loader = useInfiniteLoader(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- createInfiniteQuery result type doesn't match useInfiniteLoader generic exactly
		() => feed as any,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)
	onDestroy(() => loader.destroy())
</script>

<div class="notifications-pane">
	{#if hasUnread}
		<div class="pane-toolbar">
			<Button
				variant="ghost"
				size="small"
				onclick={() => markAllRead.mutate()}
				disabled={markAllRead.isPending}
			>
				{m.notifications_mark_all_read()}
			</Button>
		</div>
	{/if}

	<NotificationList
		{notifications}
		isLoading={feed.isLoading}
		isError={feed.isError}
		onNavigate={() => sidebar.close()}
	/>

	{#if feed.hasNextPage}
		<div class="load-more-sentinel" bind:this={sentinelEl}></div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.notifications-pane {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		padding: spacing.$unit;
	}

	.pane-toolbar {
		display: flex;
		justify-content: flex-end;
	}

	.load-more-sentinel {
		height: 1px;
	}
</style>
