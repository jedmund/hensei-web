/**
 * Pure helpers for the user settings modal: mapping the API user to form
 * values, building the save payload and cookie, patching the cached user,
 * and deciding which side effects a save needs.
 */

import type { UserSettings } from '$lib/api/adapters/user.adapter'
import type { UserResponse, UserUpdateParams } from '$lib/api/resources/users'
import type { UserCookie } from '$lib/types/UserCookie'
import type { ElementType } from '$lib/components/ui/SettingsNav.svelte'

/** Query key for the current user as loaded by the settings modal */
export const SETTINGS_USER_QUERY_KEY = ['currentUser', 'settings'] as const

/** Form fields that are populated from the API user */
export interface SettingsFormValues {
	// Account
	displayName: string
	email: string
	emailVerified: boolean
	hasPassword: boolean
	passwordPromptDismissed: boolean
	// Profile
	picture: string
	element: ElementType
	description: string
	granblueId: string
	wikiProfile: string
	youtube: string
	gender: number
	language: string
	theme: string
	// Privacy
	collectionPrivacy: number
	showCrewGamertag: boolean
	importWeapons: boolean
	defaultImportVisibility: number
	simplePortraits: boolean
	defaultRepView: string
	timezone: string
}

/** Everything a save sends, including the username (not loaded from the API) */
export interface SettingsSaveValues extends Omit<
	SettingsFormValues,
	'email' | 'emailVerified' | 'hasPassword' | 'passwordPromptDismissed'
> {
	username: string
}

export function browserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Map the API user to form values, falling back to the defaults for missing fields */
export function formValuesFromUser(
	data: UserSettings,
	fallbackTimezone: string = browserTimezone()
): SettingsFormValues {
	return {
		displayName: data.displayName ?? '',
		email: data.email ?? '',
		emailVerified: data.emailVerified ?? false,
		hasPassword: data.hasPassword ?? true,
		passwordPromptDismissed: data.passwordPromptDismissed ?? false,
		picture: data.avatar?.picture ?? '',
		element: (data.avatar?.element as ElementType) ?? 'wind',
		description: data.description ?? '',
		granblueId: data.granblueId ?? '',
		wikiProfile: data.wikiProfile ?? '',
		youtube: data.youtube ?? '',
		gender: data.gender ?? 0,
		language: data.language ?? 'en',
		theme: data.theme ?? 'system',
		collectionPrivacy: data.collectionPrivacy ?? 1,
		showCrewGamertag: data.showCrewGamertag ?? false,
		importWeapons: data.importWeapons ?? true,
		defaultImportVisibility: data.defaultImportVisibility ?? 1,
		simplePortraits: data.simplePortraits ?? false,
		defaultRepView: data.defaultRepView ?? 'weapons',
		timezone: data.timezone || fallbackTimezone
	}
}

/** The values compared against on save to decide which side effects run */
export interface SettingsOriginals {
	language: string
	theme: string
}

export function originalsFromUser(data: UserSettings): SettingsOriginals {
	return {
		language: data.language ?? 'en',
		theme: data.theme ?? 'system'
	}
}

/** Build the `users.update` params. Empty optional text fields are omitted. */
export function buildUpdateParams(values: SettingsSaveValues): UserUpdateParams {
	return {
		username: values.username,
		displayName: values.displayName || undefined,
		description: values.description || undefined,
		picture: values.picture,
		element: values.element,
		gender: values.gender,
		language: values.language,
		theme: values.theme,
		granblueId: values.granblueId || undefined,
		wikiProfile: values.wikiProfile || undefined,
		youtube: values.youtube || undefined,
		showCrewGamertag: values.showCrewGamertag,
		collectionPrivacy: values.collectionPrivacy,
		importWeapons: values.importWeapons,
		defaultImportVisibility: values.defaultImportVisibility,
		simplePortraits: values.simplePortraits,
		defaultRepView: values.defaultRepView,
		timezone: values.timezone
	}
}

/** Build the user cookie from the saved response; bahamut is client-only */
export function buildUserCookie(response: UserResponse, bahamut: boolean): UserCookie {
	return {
		picture: response.avatar.picture,
		element: response.avatar.element,
		language: response.language,
		gender: response.gender,
		theme: response.theme,
		bahamut,
		granblueId: response.granblueId,
		wikiProfile: response.wikiProfile,
		youtube: response.youtube,
		showCrewGamertag: response.showCrewGamertag,
		collectionPrivacy: response.collectionPrivacy,
		importWeapons: response.importWeapons,
		defaultImportVisibility: response.defaultImportVisibility,
		simplePortraits: response.simplePortraits,
		defaultRepView: response.defaultRepView
	}
}

/**
 * Patch the cached settings user with the saved form values, so reopening
 * the modal shows them. Username and display name aren't patched.
 */
export function patchCachedUser(
	oldData: Record<string, unknown> | undefined,
	values: SettingsSaveValues
): Record<string, unknown> | undefined {
	if (!oldData) return oldData
	return {
		...oldData,
		avatar: {
			...(oldData.avatar as Record<string, unknown>),
			picture: values.picture,
			element: values.element
		},
		description: values.description,
		granblueId: values.granblueId,
		wikiProfile: values.wikiProfile,
		youtube: values.youtube,
		gender: values.gender,
		language: values.language,
		theme: values.theme,
		collectionPrivacy: values.collectionPrivacy,
		showCrewGamertag: values.showCrewGamertag,
		importWeapons: values.importWeapons,
		defaultImportVisibility: values.defaultImportVisibility,
		simplePortraits: values.simplePortraits,
		defaultRepView: values.defaultRepView,
		timezone: values.timezone
	}
}

/** Mark the password prompt as dismissed on the cached settings user */
export function patchPasswordPromptDismissed(
	oldData: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
	return oldData ? { ...oldData, passwordPromptDismissed: true } : oldData
}

export interface SaveEffectsInput {
	originalTheme: string
	theme: string
	originalLanguage: string
	language: string
	/** `bahamut` as stored in the cookie (may be missing) */
	cookieBahamut: boolean | undefined
	bahamut: boolean
}

export interface SaveEffects {
	/** Apply the new theme immediately */
	applyTheme: boolean
	/** Navigate to the re-localized URL after invalidating */
	relocalize: boolean
}

export function saveEffects(input: SaveEffectsInput): SaveEffects {
	return {
		applyTheme: input.originalTheme !== input.theme,
		relocalize: input.originalLanguage !== input.language || input.cookieBahamut !== input.bahamut
	}
}

/** A changed username needs confirmation before saving */
export function needsUsernameConfirm(formUsername: string, username: string): boolean {
	return formUsername !== username
}
