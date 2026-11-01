/**
 * Form state for the user settings modal: loads the current user into the
 * account, profile, appearance and privacy fields, keeps the originals the
 * save compares against, and runs the save and its side effects.
 *
 * Create it during component init: it registers queries and effects.
 */

import { untrack } from 'svelte'
import { createQuery, useQueryClient, type QueryClient } from '@tanstack/svelte-query'
import { invalidateAll } from '$app/navigation'
import * as m from '$lib/paraglide/messages'
import { localizeHref, deLocalizeHref, toLocale } from '$lib/paraglide/runtime'
import { users } from '$lib/api/resources/users'
import { crewQueries } from '$lib/api/queries/crew.queries'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'
import { updateSimplePortraits } from '$lib/stores/simplePortraits.svelte'
import { updateDefaultRepView } from '$lib/stores/defaultRepView.svelte'
import type { UserCookie } from '$lib/types/UserCookie'
import type { ElementType } from '$lib/components/ui/SettingsNav.svelte'
import {
	SETTINGS_USER_QUERY_KEY,
	browserTimezone,
	buildUpdateParams,
	buildUserCookie,
	formValuesFromUser,
	needsUsernameConfirm,
	originalsFromUser,
	patchCachedUser,
	patchPasswordPromptDismissed,
	saveEffects,
	type SettingsFormValues,
	type SettingsSaveValues
} from './settings-form.utils'

export interface UserSettingsOptions {
	open: () => boolean
	username: () => string
	userId: () => string
	user: () => UserCookie
	/** Close the modal after a successful save */
	close: () => void
	/** Full-page navigation after a language change (defaults to setting window.location.href) */
	navigate?: (href: string) => void
}

export class UserSettingsState implements SettingsFormValues {
	#opts: UserSettingsOptions
	#queryClient: QueryClient

	// --- Account ---
	formUsername = $state('')
	displayName = $state('')
	email = $state('')
	emailVerified = $state(false)
	hasPassword = $state(true)
	passwordPromptDismissed = $state(false)
	currentPassword = $state('')
	newPassword = $state('')
	confirmPassword = $state('')
	/** Client-side preference, kept in the cookie */
	bahamut = $derived.by(() => this.#opts.user().bahamut ?? false)

	// --- Profile ---
	picture = $state('')
	element = $state<ElementType>('wind')
	description = $state('')
	granblueId = $state('')
	wikiProfile = $state('')
	youtube = $state('')
	gender = $state(0)

	// --- Appearance ---
	language = $state('en')
	theme = $state('system')
	simplePortraits = $state(false)
	defaultRepView = $state('weapons')
	timezone = $state(browserTimezone())

	// --- Privacy ---
	collectionPrivacy = $state(1) // 1 = Everyone (1-based to avoid JS falsy 0)
	showCrewGamertag = $state(false)
	importWeapons = $state(true)
	defaultImportVisibility = $state(1)

	/** Whether the form has been populated from the API */
	formInitialized = $state(false)
	#originalLanguage = $state('')
	#originalTheme = $state('')

	saving = $state(false)
	usernameValid = $state(true)
	usernameConfirmOpen = $state(false)
	error = $state<string | null>(null)

	readonly currentUserQuery
	readonly myCrewQuery

	readonly isInCrew = $derived.by(() => !!this.myCrewQuery.data)
	readonly crewGamertag = $derived.by(() => this.myCrewQuery.data?.gamertag ?? undefined)
	readonly isLoading = $derived.by(() => this.currentUserQuery.isPending && !this.formInitialized)

	constructor(opts: UserSettingsOptions) {
		this.#opts = opts
		this.formUsername = untrack(() => opts.username())
		this.#queryClient = useQueryClient()

		this.currentUserQuery = createQuery(() => ({
			queryKey: SETTINGS_USER_QUERY_KEY,
			queryFn: () => userAdapter.getCurrentUser(),
			enabled: this.#opts.open(), // Only fetch when modal is open
			staleTime: 0 // Always refetch when modal opens to ensure fresh data
		}))

		// The user's crew, for showing the gamertag toggle
		this.myCrewQuery = createQuery(() => ({
			...crewQueries.myCrew(),
			enabled: this.#opts.open()
		}))

		// Populate the form when the API returns data
		$effect(() => {
			const data = this.currentUserQuery.data
			if (data && !this.formInitialized) {
				Object.assign(this as SettingsFormValues, formValuesFromUser(data))
				const originals = originalsFromUser(data)
				this.#originalLanguage = originals.language
				this.#originalTheme = originals.theme
				this.formInitialized = true
			}
		})

		// Repopulate next time the modal opens
		$effect(() => {
			if (!this.#opts.open()) {
				this.formInitialized = false
			}
		})
	}

	#saveValues(): SettingsSaveValues {
		return {
			username: this.formUsername,
			displayName: this.displayName,
			picture: this.picture,
			element: this.element,
			description: this.description,
			granblueId: this.granblueId,
			wikiProfile: this.wikiProfile,
			youtube: this.youtube,
			gender: this.gender,
			language: this.language,
			theme: this.theme,
			collectionPrivacy: this.collectionPrivacy,
			showCrewGamertag: this.showCrewGamertag,
			importWeapons: this.importWeapons,
			defaultImportVisibility: this.defaultImportVisibility,
			simplePortraits: this.simplePortraits,
			defaultRepView: this.defaultRepView,
			timezone: this.timezone
		}
	}

	dismissPasswordPrompt = () => {
		this.passwordPromptDismissed = true
		this.#queryClient.setQueryData(SETTINGS_USER_QUERY_KEY, patchPasswordPromptDismissed)
	}

	/** Ask to confirm a username change before saving */
	requestSave = () => {
		if (needsUsernameConfirm(this.formUsername, this.#opts.username())) {
			this.usernameConfirmOpen = true
		} else {
			this.save()
		}
	}

	save = async () => {
		this.usernameConfirmOpen = false
		this.error = null
		this.saving = true

		try {
			const response = await users.update(
				this.#opts.userId(),
				buildUpdateParams(this.#saveValues())
			)

			// Update the cookie server-side; include username so the account
			// cookie gets updated too
			const updatedUser = buildUserCookie(response, this.bahamut)
			await fetch('/api/settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ...updatedUser, username: response.username })
			})

			// Read the form again: the rest of the save uses its current values
			const values = this.#saveValues()

			// Update the cache so reopening the modal shows the saved values
			this.#queryClient.setQueryData(SETTINGS_USER_QUERY_KEY, (oldData) =>
				patchCachedUser(oldData as Record<string, unknown> | undefined, values)
			)

			const effects = saveEffects({
				originalTheme: this.#originalTheme,
				theme: values.theme,
				originalLanguage: this.#originalLanguage,
				language: values.language,
				cookieBahamut: this.#opts.user().bahamut,
				bahamut: this.bahamut
			})

			// Apply theme change immediately without reload
			if (effects.applyTheme) {
				themeStore.setTheme(values.theme as ThemePreference)
			}

			updateSimplePortraits(response.simplePortraits ?? false)
			updateDefaultRepView(response.defaultRepView ?? 'weapons')

			await invalidateAll()
			// A language or bahamut change needs the re-localized URL
			if (effects.relocalize) {
				const basePath = deLocalizeHref(
					window.location.pathname + window.location.search + window.location.hash
				)
				const href = localizeHref(basePath, { locale: toLocale(values.language) })
				if (this.#opts.navigate) this.#opts.navigate(href)
				else window.location.href = href
			}

			this.#opts.close()
		} catch (err) {
			console.error('Failed to update settings:', err)
			this.error = m.settings_save_error()
		} finally {
			this.saving = false
		}
	}
}
