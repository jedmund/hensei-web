import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import type { UserSettings } from '$lib/api/adapters/user.adapter'
import type { UserCookie } from '$lib/types/UserCookie'
import { UserSettingsState, type UserSettingsOptions } from '../userSettingsState.svelte'

const mocks = vi.hoisted(() => ({
	/** Side effects in the order they ran */
	calls: [] as string[],
	setQueryData: vi.fn(),
	update: vi.fn(),
	fetch: vi.fn(),
	invalidateAll: vi.fn(),
	setTheme: vi.fn(),
	updateSimplePortraits: vi.fn(),
	updateDefaultRepView: vi.fn()
}))

/** Query results, reactive so the populate effect sees new data */
const queries = $state<{ user: UserSettings | undefined; crew: unknown; isPending: boolean }>({
	user: undefined,
	crew: undefined,
	isPending: true
})

vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const fakeQuery = (fn: () => { queryKey?: readonly unknown[]; enabled?: boolean }) => ({
		get data() {
			const options = fn()
			if (options.enabled === false) return undefined
			return options.queryKey?.[0] === 'currentUser' ? queries.user : queries.crew
		},
		get isPending() {
			return queries.isPending
		}
	})
	return {
		...actual,
		createQuery: fakeQuery,
		useQueryClient: () => ({ setQueryData: mocks.setQueryData })
	}
})

vi.mock('$app/navigation', () => ({ invalidateAll: mocks.invalidateAll }))
vi.mock('$lib/api/resources/users', () => ({ users: { update: mocks.update } }))
vi.mock('$lib/api/adapters/user.adapter', () => ({ userAdapter: { getCurrentUser: vi.fn() } }))
vi.mock('$lib/api/queries/crew.queries', () => ({
	crewQueries: { myCrew: () => ({ queryKey: ['crew', 'my'] }) }
}))
vi.mock('$lib/stores/theme.svelte', () => ({ themeStore: { setTheme: mocks.setTheme } }))
vi.mock('$lib/stores/simplePortraits.svelte', () => ({
	updateSimplePortraits: mocks.updateSimplePortraits
}))
vi.mock('$lib/stores/defaultRepView.svelte', () => ({
	updateDefaultRepView: mocks.updateDefaultRepView
}))
vi.mock('$lib/paraglide/messages', () => ({ settings_save_error: () => 'save failed' }))
vi.mock('$lib/paraglide/runtime', () => ({
	deLocalizeHref: (href: string) => `base:${href}`,
	localizeHref: (href: string, opts: { locale?: string }) => `${opts.locale}:${href}`,
	toLocale: (value: string) => value
}))

function apiUser(overrides: Partial<UserSettings> = {}): UserSettings {
	return {
		id: 'u1',
		username: 'alice',
		displayName: 'Alice',
		description: '',
		language: 'en',
		private: false,
		gender: 0,
		theme: 'system',
		role: 1,
		granblueId: '',
		showCrewGamertag: false,
		wikiProfile: '',
		youtube: '',
		collectionPrivacy: 1,
		importWeapons: true,
		defaultImportVisibility: 1,
		simplePortraits: false,
		defaultRepView: 'weapons',
		timezone: 'Asia/Tokyo',
		avatar: { picture: 'pic', element: 'fire' },
		email: 'a@example.com',
		emailVerified: true,
		hasPassword: true,
		passwordPromptDismissed: false,
		...overrides
	}
}

const cookie: UserCookie = {
	picture: 'pic',
	element: 'fire',
	language: 'en',
	gender: 0,
	theme: 'system',
	bahamut: false
}

let cleanup: (() => void) | undefined
let open = $state(true)

function create(overrides: Partial<UserSettingsOptions> = {}) {
	let state!: UserSettingsState
	const close = vi.fn(() => {
		mocks.calls.push('close')
	})
	const navigate = vi.fn((href: string) => {
		mocks.calls.push(`navigate ${href}`)
	})
	cleanup = $effect.root(() => {
		state = new UserSettingsState({
			open: () => open,
			username: () => 'alice',
			userId: () => 'u1',
			user: () => cookie,
			close,
			navigate,
			...overrides
		})
	})
	flushSync()
	return { state, close, navigate }
}

/** Create with the user loaded */
function createLoaded(overrides: Partial<UserSettingsOptions> = {}, user = apiUser()) {
	queries.user = user
	queries.isPending = false
	return create(overrides)
}

beforeEach(() => {
	open = true
	queries.user = undefined
	queries.crew = undefined
	queries.isPending = true
	mocks.calls.length = 0
	for (const fn of [
		mocks.setQueryData,
		mocks.update,
		mocks.fetch,
		mocks.invalidateAll,
		mocks.setTheme,
		mocks.updateSimplePortraits,
		mocks.updateDefaultRepView
	]) {
		fn.mockReset()
	}
	mocks.update.mockImplementation(async (_id: string, params: Record<string, unknown>) => {
		mocks.calls.push('update')
		return {
			id: 'u1',
			username: params.username,
			avatar: { picture: params.picture, element: params.element },
			gender: params.gender,
			language: params.language,
			theme: params.theme,
			role: 1,
			simplePortraits: params.simplePortraits,
			defaultRepView: params.defaultRepView
		}
	})
	mocks.fetch.mockImplementation(async () => {
		mocks.calls.push('fetch')
		return new Response('{}')
	})
	mocks.setQueryData.mockImplementation(() => mocks.calls.push('setQueryData'))
	mocks.setTheme.mockImplementation(() => mocks.calls.push('setTheme'))
	mocks.updateSimplePortraits.mockImplementation(() => mocks.calls.push('simplePortraits'))
	mocks.updateDefaultRepView.mockImplementation(() => mocks.calls.push('defaultRepView'))
	mocks.invalidateAll.mockImplementation(async () => mocks.calls.push('invalidateAll'))
	vi.stubGlobal('fetch', mocks.fetch)
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
	cleanup?.()
	cleanup = undefined
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('UserSettingsState', () => {
	describe('loading', () => {
		it('is loading until the user arrives', () => {
			const { state } = create()
			expect(state.isLoading).toBe(true)
			expect(state.formInitialized).toBe(false)
		})

		it('seeds the username from the prop', () => {
			expect(create().state.formUsername).toBe('alice')
		})

		it('populates the form from the API user', () => {
			const { state } = create()
			queries.user = apiUser({ displayName: 'Ally', theme: 'dark' })
			queries.isPending = false
			flushSync()
			expect(state.formInitialized).toBe(true)
			expect(state.isLoading).toBe(false)
			expect(state.displayName).toBe('Ally')
			expect(state.theme).toBe('dark')
			expect(state.element).toBe('fire')
			expect(state.email).toBe('a@example.com')
			expect(state.timezone).toBe('Asia/Tokyo')
		})

		it('keeps edits when the query data changes while open', () => {
			const { state } = createLoaded()
			state.displayName = 'Edited'
			queries.user = apiUser({ displayName: 'Refetched' })
			flushSync()
			expect(state.displayName).toBe('Edited')
		})

		it('repopulates after closing and reopening', () => {
			const { state } = createLoaded()
			state.displayName = 'Edited'
			open = false
			flushSync()
			expect(state.formInitialized).toBe(false)
			open = true
			flushSync()
			expect(state.formInitialized).toBe(true)
			expect(state.displayName).toBe('Alice')
		})

		it('reads crew membership from the crew query', () => {
			const { state } = create()
			expect(state.isInCrew).toBe(false)
			queries.crew = { gamertag: 'TAG' }
			flushSync()
			expect(state.isInCrew).toBe(true)
			expect(state.crewGamertag).toBe('TAG')
		})
	})

	describe('bahamut', () => {
		it('follows the cookie and can be toggled', () => {
			const { state } = create({ user: () => ({ ...cookie, bahamut: true }) })
			expect(state.bahamut).toBe(true)
			state.bahamut = false
			expect(state.bahamut).toBe(false)
		})
	})

	describe('password prompt', () => {
		it('dismisses locally and in the cache', () => {
			const { state } = createLoaded()
			state.dismissPasswordPrompt()
			expect(state.passwordPromptDismissed).toBe(true)
			const [key, updater] = mocks.setQueryData.mock.calls[0]!
			expect(key).toEqual(['currentUser', 'settings'])
			expect(updater({ a: 1 })).toEqual({ a: 1, passwordPromptDismissed: true })
		})
	})

	describe('requestSave', () => {
		it('saves straight away when the username is unchanged', async () => {
			const { state } = createLoaded()
			state.requestSave()
			expect(state.usernameConfirmOpen).toBe(false)
			await vi.waitFor(() => expect(mocks.update).toHaveBeenCalled())
		})

		it('asks to confirm a username change', () => {
			const { state } = createLoaded()
			state.formUsername = 'bob'
			state.requestSave()
			expect(state.usernameConfirmOpen).toBe(true)
			expect(mocks.update).not.toHaveBeenCalled()
		})
	})

	describe('save', () => {
		it('sends the payload and cookie, then runs the side effects in order', async () => {
			const { state, close, navigate } = createLoaded()
			state.description = 'new bio'
			state.usernameConfirmOpen = true
			await state.save()

			expect(mocks.update).toHaveBeenCalledWith('u1', {
				username: 'alice',
				displayName: 'Alice',
				description: 'new bio',
				picture: 'pic',
				element: 'fire',
				gender: 0,
				language: 'en',
				theme: 'system',
				granblueId: undefined,
				wikiProfile: undefined,
				youtube: undefined,
				showCrewGamertag: false,
				collectionPrivacy: 1,
				importWeapons: true,
				defaultImportVisibility: 1,
				simplePortraits: false,
				defaultRepView: 'weapons',
				timezone: 'Asia/Tokyo'
			})
			const [url, init] = mocks.fetch.mock.calls[0]!
			expect(url).toBe('/api/settings')
			expect(init.method).toBe('POST')
			expect(JSON.parse(init.body)).toMatchObject({
				picture: 'pic',
				element: 'fire',
				bahamut: false,
				username: 'alice'
			})
			expect(mocks.calls).toEqual([
				'update',
				'fetch',
				'setQueryData',
				'simplePortraits',
				'defaultRepView',
				'invalidateAll',
				'close'
			])
			expect(navigate).not.toHaveBeenCalled()
			expect(close).toHaveBeenCalledOnce()
			expect(state.saving).toBe(false)
			expect(state.usernameConfirmOpen).toBe(false)
			expect(state.error).toBeNull()
		})

		it('patches the cached user with the saved values', async () => {
			const { state } = createLoaded()
			state.youtube = 'tube'
			await state.save()
			const [key, updater] = mocks.setQueryData.mock.calls[0]!
			expect(key).toEqual(['currentUser', 'settings'])
			expect(updater({ avatar: { picture: 'old' } })).toMatchObject({
				avatar: { picture: 'pic', element: 'fire' },
				youtube: 'tube'
			})
		})

		it('applies a changed theme', async () => {
			const { state } = createLoaded()
			state.theme = 'dark'
			await state.save()
			expect(mocks.setTheme).toHaveBeenCalledWith('dark')
			expect(mocks.calls.indexOf('setTheme')).toBe(mocks.calls.indexOf('setQueryData') + 1)
		})

		it('navigates to the re-localized URL after a language change', async () => {
			const { state, navigate } = createLoaded()
			state.language = 'ja'
			await state.save()
			expect(navigate).toHaveBeenCalledWith(`ja:base:${window.location.pathname}`)
			expect(mocks.calls.slice(-3)).toEqual([
				'invalidateAll',
				`navigate ja:base:${window.location.pathname}`,
				'close'
			])
		})

		it('navigates after a bahamut change', async () => {
			const { state, navigate } = createLoaded()
			state.bahamut = true
			await state.save()
			expect(navigate).toHaveBeenCalledOnce()
			expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body).bahamut).toBe(true)
		})

		it('shows an error and stays open when the update fails', async () => {
			mocks.update.mockRejectedValueOnce(new Error('nope'))
			const { state, close } = createLoaded()
			await state.save()
			expect(state.error).toBe('save failed')
			expect(state.saving).toBe(false)
			expect(close).not.toHaveBeenCalled()
			expect(mocks.fetch).not.toHaveBeenCalled()
		})
	})
})
