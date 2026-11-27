<script lang="ts">
	/**
	 * One notification, in the jewel's popover or the "View all" pane. Clicking
	 * it marks it read and follows its link. Pending invitations and phantom
	 * assignments get Accept/Decline inline.
	 */
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		useAcceptInvitation,
		useRejectInvitation,
		useConfirmPhantomClaim,
		useDeclinePhantomClaim
	} from '$lib/api/mutations/crew.mutations'
	import { useMarkNotificationRead } from '$lib/api/mutations/notification.mutations'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte'
	import StickerImage from '$lib/components/stickers/StickerImage.svelte'
	import type { AppNotification, NotificationKind } from '$lib/types/api/notification'
	import { formatRelativeTime } from '$lib/utils/date'
	import { extractErrorMessage } from '$lib/utils/errors'
	import {
		isPendingAction,
		notificationHref,
		notificationMessage,
		notificationStateLabel
	} from './notificationText'

	interface Props {
		notification: AppNotification
		/** Called before following the row's link, e.g. to close the popover */
		onNavigate?: () => void
	}

	const { notification, onNavigate }: Props = $props()

	const ICONS: Record<NotificationKind, string> = {
		sticker_received: 'sticker',
		party_remixed: 'remix',
		party_featured: 'favorite',
		crew_invited: 'mail',
		phantom_assigned: 'mail'
	}

	const markRead = useMarkNotificationRead()
	const acceptInvitation = useAcceptInvitation()
	const rejectInvitation = useRejectInvitation()
	const confirmClaim = useConfirmPhantomClaim()
	const declineClaim = useDeclinePhantomClaim()

	let processing = $state(false)

	const message = $derived(notificationMessage(notification))
	const href = $derived(notificationHref(notification))
	const stateLabel = $derived(notificationStateLabel(notification.state))
	const pending = $derived(isPendingAction(notification))
	const time = $derived(formatRelativeTime(notification.updatedAt, getLocale()))

	function markAsRead() {
		if (!notification.read) markRead.mutate(notification.id)
	}

	function handleClick(event: MouseEvent) {
		markAsRead()
		if (!href) return
		event.preventDefault()
		onNavigate?.()
		goto(href)
	}

	async function run(action: () => Promise<unknown>, fallback: string, after?: () => void) {
		processing = true
		try {
			await action()
			markAsRead()
			after?.()
		} catch (error) {
			toast.error(extractErrorMessage(error, fallback))
		} finally {
			processing = false
		}
	}

	function accept() {
		if (notification.kind === 'crew_invited' && notification.invitationId) {
			const id = notification.invitationId
			run(
				() => acceptInvitation.mutateAsync(id),
				'Failed to accept invitation',
				() => {
					onNavigate?.()
					goto('/crew')
				}
			)
		} else if (notification.crew && notification.phantom) {
			const vars = { crewId: notification.crew.id, phantomId: notification.phantom.id }
			run(() => confirmClaim.mutateAsync(vars), 'Failed to accept claim')
		}
	}

	function decline() {
		if (notification.kind === 'crew_invited' && notification.invitationId) {
			const id = notification.invitationId
			run(() => rejectInvitation.mutateAsync(id), 'Failed to reject invitation')
		} else if (notification.crew && notification.phantom) {
			const vars = { crewId: notification.crew.id, phantomId: notification.phantom.id }
			run(() => declineClaim.mutateAsync(vars), 'Failed to decline claim')
		}
	}
</script>

<div class="notification-row" class:unread={!notification.read}>
	<a class="row-main" href={href ?? undefined} onclick={handleClick}>
		<span class="row-leading" aria-hidden="true">
			{#if notification.kind === 'sticker_received' && notification.sticker}
				<StickerImage sticker={notification.sticker} size={32} />
			{:else if notification.actor}
				<UserAvatar user={notification.actor} size={32} />
			{:else}
				<span class="row-icon"><Icon name={ICONS[notification.kind]} size={14} /></span>
			{/if}
		</span>
		<span class="row-text">
			<span class="row-message">{message}</span>
			<span class="row-meta">
				<time datetime={notification.updatedAt}>{time}</time>
				{#if stateLabel}
					<span class="row-state">· {stateLabel}</span>
				{/if}
			</span>
		</span>
		{#if !notification.read}
			<span class="unread-dot" aria-hidden="true"></span>
		{/if}
	</a>

	{#if pending}
		<div class="row-actions">
			<Button variant="secondary" size="small" onclick={decline} disabled={processing}>
				{m.crew_notifications_decline()}
			</Button>
			<Button variant="primary" size="small" onclick={accept} disabled={processing}>
				{m.crew_notifications_accept()}
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.notification-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}
	}

	.row-main {
		display: flex;
		align-items: flex-start;
		gap: spacing.$unit * 1.5;
		color: inherit;
		text-decoration: none;
		outline: none;
		border-radius: layout.$item-corner-small;

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}

	.row-leading {
		flex-shrink: 0;
		display: flex;
		width: 32px;
		height: 32px;
		align-items: center;
		justify-content: center;
	}

	.row-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: var(--button-bg);
		color: var(--text-secondary);
	}

	.row-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
	}

	.row-message {
		font-size: typography.$font-small;
		color: var(--text-primary);
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	.unread .row-message {
		font-weight: typography.$medium;
	}

	.row-meta {
		font-size: typography.$font-tiny;
		color: var(--text-secondary);
	}

	.unread-dot {
		flex-shrink: 0;
		width: 8px;
		height: 8px;
		margin-top: spacing.$unit-three-quarter;
		border-radius: 50%;
		background-color: var(--accent-blue);
	}

	.row-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
		padding-left: calc(32px + spacing.$unit * 1.5);
	}
</style>
