import { page } from '$app/state'
import { goto } from '$app/navigation'
import { createQuery, type CreateQueryResult } from '@tanstack/svelte-query'
import { toast } from 'svelte-sonner'
import { crewQueries } from '$lib/api/queries/crew.queries'
import type { SettingsReturn } from '$lib/auth/socialResult'
import type { CrewInvitation, PhantomPlayer } from '$lib/types/api/crew'
import { localizeHref } from '$lib/paraglide/runtime'
import { authStore } from '$lib/stores/auth.store.svelte'
import type { UserCookie } from '$lib/types/UserCookie'
import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
import { isHomePath } from '$lib/utils/browseRoutes'
import { extractErrorMessage } from '$lib/utils/errors'
import { useSettingsReturn } from '../settings/settingsReturn.svelte'
import { localizeNavHrefs, mainNavLinks, moreNavLinks } from './navLinks'

export type NavElement = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

export interface NavigationProps {
	account?: {
		userId: string
		username: string
		role: number
	} | null
	currentUser?: UserCookie | null
	isAuthenticated?: boolean
}

/**
 * State shared by the desktop and mobile navigation: who's signed in, which
 * link is selected, the crew notification queries and the settings and
 * notification modals. Create it once, during component init (it runs
 * queries and effects).
 */
export class NavigationState {
	// Set by the constructor; the deriveds below only read it after that
	#props: () => NavigationProps = () => ({})

	readonly account = $derived(this.#props().account)
	readonly currentUser = $derived(this.#props().currentUser)
	readonly username = $derived(this.account?.username ?? '')
	// Use the reactive authStore instead of the static server prop for real-time auth state
	readonly isAuth = $derived(authStore.isAuthenticated || (this.#props().isAuthenticated ?? false))
	readonly role = $derived(this.account?.role ?? null)
	// Element from UserCookie is already a string like "fire", "water", etc.
	readonly userElement = $derived(this.currentUser?.element as NavElement | undefined)
	readonly elementClass = $derived(this.userElement ? `element-${this.userElement}` : '')
	readonly isBahamut = $derived(this.currentUser?.bahamut === true)

	readonly avatarSrc = $derived(getAvatarSrc(this.currentUser?.picture))
	readonly avatarSrcSet = $derived(getAvatarSrcSet(this.currentUser?.picture))

	readonly hrefs = $derived(localizeNavHrefs())
	readonly mainLinks = $derived(mainNavLinks(this.hrefs, this.isAuth, this.username))
	readonly moreLinks = $derived(moreNavLinks(this.hrefs, this.isAuth ? this.role : null))

	readonly isDatabaseRoute = $derived(page.url.pathname.startsWith(this.hrefs.database))

	// The profile link stays selected on its sub-routes (/favorites, /collection)
	readonly isProfileSelected = $derived.by(() => {
		if (!this.isAuth) return false
		const path = page.url.pathname
		const userProfileHref = localizeHref(`/${this.username}`)
		return (
			path === this.hrefs.me || path === userProfileHref || path.startsWith(userProfileHref + '/')
		)
	})

	// Settings modal
	settingsModalOpen = $state(false)
	settingsSection = $state<string | undefined>(undefined)
	socialResult = $state<SettingsReturn | null>(null)

	// Notifications modal (invitations + phantom claims)
	invitationsModalOpen = $state(false)

	readonly pendingInvitations: CreateQueryResult<CrewInvitation[]>
	readonly pendingPhantomClaims: CreateQueryResult<PhantomPlayer[]>
	readonly notificationCount = $derived.by(() => {
		if (!this.isAuth) return 0
		const invitations = this.pendingInvitations.data?.length ?? 0
		const claims = this.pendingPhantomClaims.data?.length ?? 0
		return invitations + claims
	})

	constructor(props: () => NavigationProps) {
		this.#props = props

		// The user's crew decides whether phantom claims are fetched
		const myCrew = createQuery(() => ({
			...crewQueries.myCrew(),
			enabled: this.isAuth
		}))

		this.pendingInvitations = createQuery(() => ({
			...crewQueries.pendingInvitations(),
			enabled: this.isAuth
		}))

		this.pendingPhantomClaims = createQuery(() => ({
			...crewQueries.pendingPhantomClaims(),
			enabled: this.isAuth && myCrew.data != null
		}))

		useSettingsReturn(
			() => this.isAuth,
			(result) => {
				this.socialResult = result
				this.settingsSection = 'account'
				this.settingsModalOpen = true
			}
		)
	}

	isNavSelected = (href: string): boolean => {
		const path = page.url.pathname

		// Every path starts with the home path, so Home only matches exactly
		if (href === this.hrefs.home) return isHomePath(path, this.hrefs.home)

		// Exact match or starts with href + /
		return path === href || path.startsWith(href + '/')
	}

	handleSettingsOpenChange = (open: boolean) => {
		this.settingsModalOpen = open
		if (!open) {
			this.socialResult = null
			this.settingsSection = undefined
		}
	}
}

export async function logout() {
	try {
		const response = await fetch('/auth/logout', {
			method: 'POST',
			credentials: 'include'
		})

		if (response.ok) {
			// Navigate to login page after successful logout
			await goto('/auth/login')
		}
	} catch (error) {
		console.error('Logout failed:', error)
		toast.error(extractErrorMessage(error, 'Failed to log out'))
	}
}
