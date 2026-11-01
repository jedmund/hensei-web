import { describe, it, expect } from 'vitest'
import type { UserSettings } from '$lib/api/adapters/user.adapter'
import type { UserResponse } from '$lib/api/resources/users'
import {
	buildUpdateParams,
	buildUserCookie,
	formValuesFromUser,
	needsUsernameConfirm,
	originalsFromUser,
	patchCachedUser,
	patchPasswordPromptDismissed,
	saveEffects,
	type SettingsSaveValues
} from '../settings-form.utils'

function apiUser(overrides: Partial<UserSettings> = {}): UserSettings {
	return {
		id: 'u1',
		username: 'alice',
		displayName: 'Alice',
		description: 'hi',
		language: 'ja',
		private: false,
		gender: 1,
		theme: 'dark',
		role: 1,
		granblueId: '123',
		showCrewGamertag: true,
		wikiProfile: 'Alice',
		youtube: 'alicetube',
		collectionPrivacy: 2,
		importWeapons: false,
		defaultImportVisibility: 3,
		simplePortraits: true,
		defaultRepView: 'characters',
		timezone: 'Asia/Tokyo',
		avatar: { picture: 'pic', element: 'fire' },
		email: 'a@example.com',
		emailVerified: true,
		hasPassword: false,
		passwordPromptDismissed: true,
		...overrides
	}
}

function saveValues(overrides: Partial<SettingsSaveValues> = {}): SettingsSaveValues {
	return {
		username: 'alice',
		displayName: 'Alice',
		picture: 'pic',
		element: 'fire',
		description: 'hi',
		granblueId: '123',
		wikiProfile: 'Alice',
		youtube: 'alicetube',
		gender: 1,
		language: 'ja',
		theme: 'dark',
		collectionPrivacy: 2,
		showCrewGamertag: true,
		importWeapons: false,
		defaultImportVisibility: 3,
		simplePortraits: true,
		defaultRepView: 'characters',
		timezone: 'Asia/Tokyo',
		...overrides
	}
}

describe('formValuesFromUser', () => {
	it('maps every field from the API user', () => {
		expect(formValuesFromUser(apiUser(), 'UTC')).toEqual({
			displayName: 'Alice',
			email: 'a@example.com',
			emailVerified: true,
			hasPassword: false,
			passwordPromptDismissed: true,
			picture: 'pic',
			element: 'fire',
			description: 'hi',
			granblueId: '123',
			wikiProfile: 'Alice',
			youtube: 'alicetube',
			gender: 1,
			language: 'ja',
			theme: 'dark',
			collectionPrivacy: 2,
			showCrewGamertag: true,
			importWeapons: false,
			defaultImportVisibility: 3,
			simplePortraits: true,
			defaultRepView: 'characters',
			timezone: 'Asia/Tokyo'
		})
	})

	it('falls back to the defaults for missing fields', () => {
		const sparse = {
			id: 'u1',
			username: 'alice',
			role: 1,
			private: false
		} as unknown as UserSettings
		expect(formValuesFromUser(sparse, 'UTC')).toEqual({
			displayName: '',
			email: '',
			emailVerified: false,
			hasPassword: true,
			passwordPromptDismissed: false,
			picture: '',
			element: 'wind',
			description: '',
			granblueId: '',
			wikiProfile: '',
			youtube: '',
			gender: 0,
			language: 'en',
			theme: 'system',
			collectionPrivacy: 1,
			showCrewGamertag: false,
			importWeapons: true,
			defaultImportVisibility: 1,
			simplePortraits: false,
			defaultRepView: 'weapons',
			timezone: 'UTC'
		})
	})

	it('uses the fallback timezone for an empty timezone', () => {
		expect(formValuesFromUser(apiUser({ timezone: '' }), 'Europe/Paris').timezone).toBe(
			'Europe/Paris'
		)
	})

	it('keeps a null display name as empty', () => {
		expect(formValuesFromUser(apiUser({ displayName: null })).displayName).toBe('')
	})
})

describe('originalsFromUser', () => {
	it('takes the language and theme, with defaults', () => {
		expect(originalsFromUser(apiUser())).toEqual({ language: 'ja', theme: 'dark' })
		expect(
			originalsFromUser({ ...apiUser(), language: undefined, theme: undefined } as never)
		).toEqual({ language: 'en', theme: 'system' })
	})
})

describe('buildUpdateParams', () => {
	it('sends every field', () => {
		expect(buildUpdateParams(saveValues())).toEqual({
			username: 'alice',
			displayName: 'Alice',
			description: 'hi',
			picture: 'pic',
			element: 'fire',
			gender: 1,
			language: 'ja',
			theme: 'dark',
			granblueId: '123',
			wikiProfile: 'Alice',
			youtube: 'alicetube',
			showCrewGamertag: true,
			collectionPrivacy: 2,
			importWeapons: false,
			defaultImportVisibility: 3,
			simplePortraits: true,
			defaultRepView: 'characters',
			timezone: 'Asia/Tokyo'
		})
	})

	it('omits empty optional text fields but keeps an empty picture', () => {
		const params = buildUpdateParams(
			saveValues({
				displayName: '',
				description: '',
				granblueId: '',
				wikiProfile: '',
				youtube: '',
				picture: ''
			})
		)
		expect(params.displayName).toBeUndefined()
		expect(params.description).toBeUndefined()
		expect(params.granblueId).toBeUndefined()
		expect(params.wikiProfile).toBeUndefined()
		expect(params.youtube).toBeUndefined()
		expect(params.picture).toBe('')
	})
})

describe('buildUserCookie', () => {
	it('builds the cookie from the response with the local bahamut flag', () => {
		const response: UserResponse = {
			id: 'u1',
			username: 'alice2',
			avatar: { picture: 'p2', element: 'water' },
			gender: 0,
			language: 'en',
			theme: 'light',
			role: 1,
			granblueId: '9',
			showCrewGamertag: false,
			wikiProfile: 'w',
			youtube: 'y',
			collectionPrivacy: 3,
			importWeapons: true,
			defaultImportVisibility: 2,
			simplePortraits: false,
			defaultRepView: 'summons',
			timezone: 'UTC'
		}
		expect(buildUserCookie(response, true)).toEqual({
			picture: 'p2',
			element: 'water',
			language: 'en',
			gender: 0,
			theme: 'light',
			bahamut: true,
			granblueId: '9',
			wikiProfile: 'w',
			youtube: 'y',
			showCrewGamertag: false,
			collectionPrivacy: 3,
			importWeapons: true,
			defaultImportVisibility: 2,
			simplePortraits: false,
			defaultRepView: 'summons'
		})
	})
})

describe('patchCachedUser', () => {
	it('leaves missing data alone', () => {
		expect(patchCachedUser(undefined, saveValues())).toBeUndefined()
	})

	it('patches the saved fields but not username or display name', () => {
		const old = {
			username: 'alice',
			displayName: 'Old',
			email: 'a@example.com',
			avatar: { picture: 'old', element: 'wind', extra: 1 }
		}
		const patched = patchCachedUser(old, saveValues({ username: 'new', displayName: 'New' }))
		expect(patched).toEqual({
			username: 'alice',
			displayName: 'Old',
			email: 'a@example.com',
			avatar: { picture: 'pic', element: 'fire', extra: 1 },
			description: 'hi',
			granblueId: '123',
			wikiProfile: 'Alice',
			youtube: 'alicetube',
			gender: 1,
			language: 'ja',
			theme: 'dark',
			collectionPrivacy: 2,
			showCrewGamertag: true,
			importWeapons: false,
			defaultImportVisibility: 3,
			simplePortraits: true,
			defaultRepView: 'characters',
			timezone: 'Asia/Tokyo'
		})
	})
})

describe('patchPasswordPromptDismissed', () => {
	it('sets the flag on existing data only', () => {
		expect(patchPasswordPromptDismissed({ a: 1 })).toEqual({ a: 1, passwordPromptDismissed: true })
		expect(patchPasswordPromptDismissed(undefined)).toBeUndefined()
	})
})

describe('saveEffects', () => {
	const base = {
		originalTheme: 'system',
		theme: 'system',
		originalLanguage: 'en',
		language: 'en',
		cookieBahamut: false,
		bahamut: false
	}

	it('needs nothing extra when theme, language and bahamut are unchanged', () => {
		expect(saveEffects(base)).toEqual({ applyTheme: false, relocalize: false })
	})

	it('applies a changed theme', () => {
		expect(saveEffects({ ...base, theme: 'dark' })).toEqual({
			applyTheme: true,
			relocalize: false
		})
	})

	it('relocalizes on a language change', () => {
		expect(saveEffects({ ...base, language: 'ja' }).relocalize).toBe(true)
	})

	it('relocalizes on a bahamut change', () => {
		expect(saveEffects({ ...base, bahamut: true }).relocalize).toBe(true)
	})

	it('relocalizes when the cookie has no bahamut flag', () => {
		expect(saveEffects({ ...base, cookieBahamut: undefined }).relocalize).toBe(true)
	})
})

describe('needsUsernameConfirm', () => {
	it('confirms only a changed username', () => {
		expect(needsUsernameConfirm('alice', 'alice')).toBe(false)
		expect(needsUsernameConfirm('bob', 'alice')).toBe(true)
	})
})
