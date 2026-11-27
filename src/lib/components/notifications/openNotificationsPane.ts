import { m } from '$lib/paraglide/messages'
import { sidebar } from '$lib/stores/sidebar.svelte'
import NotificationsPane from './NotificationsPane.svelte'

/** Opens every notification in the side pane (the jewel's "View all", and the mobile menu) */
export function openNotificationsPane() {
	sidebar.openWithComponent(m.nav_notifications(), NotificationsPane)
}
