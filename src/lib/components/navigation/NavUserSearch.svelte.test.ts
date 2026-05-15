import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { tick } from 'svelte'
import NavUserSearch from './NavUserSearch.svelte'

const gotoMock = vi.fn<(url: string) => Promise<void>>(async () => undefined)
vi.mock('$app/navigation', () => ({
	goto: (url: string) => gotoMock(url)
}))

const searchUsersMock = vi.fn()
vi.mock('$lib/api/adapters/user.adapter', () => ({
	userAdapter: { searchUsers: (q: string) => searchUsersMock(q) }
}))

describe('NavUserSearch', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true })
		gotoMock.mockClear()
		searchUsersMock.mockReset()
		searchUsersMock.mockResolvedValue([])
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	function makeUser(username: string, displayName?: string) {
		return {
			id: `id-${username}`,
			username,
			displayName: displayName ?? null,
			language: 'en',
			private: false,
			gender: 0,
			theme: 'system',
			role: 1,
			avatar: { picture: 'gran', element: 'fire' }
		}
	}

	async function settle(ms = 300) {
		await vi.advanceTimersByTimeAsync(ms)
		await tick()
	}

	it('does not call the API for queries shorter than 2 characters', async () => {
		const screen = render(NavUserSearch, { onClose: () => {} })
		const input = screen.getByRole('textbox')
		await input.fill('j')
		await settle(400)
		expect(searchUsersMock).not.toHaveBeenCalled()
	})

	it('debounces and calls the API after 300ms when query has 2+ chars', async () => {
		searchUsersMock.mockResolvedValueOnce([makeUser('jedmund', 'Justin')])
		const screen = render(NavUserSearch, { onClose: () => {} })
		const input = screen.getByRole('textbox')
		await input.fill('jed')
		expect(searchUsersMock).not.toHaveBeenCalled()
		await settle(350)
		expect(searchUsersMock).toHaveBeenCalledWith('jed')
	})

	it('Enter on the first result navigates via goto', async () => {
		searchUsersMock.mockResolvedValueOnce([
			makeUser('jedmund', 'Justin'),
			makeUser('kona', 'Konami')
		])
		const onClose = vi.fn()
		const screen = render(NavUserSearch, { onClose })
		const input = screen.getByRole('textbox')
		await input.fill('je')
		await settle(350)

		await input
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
		await tick()

		expect(gotoMock).toHaveBeenCalledWith('/jedmund')
	})

	it('ArrowDown moves the active row before Enter', async () => {
		searchUsersMock.mockResolvedValueOnce([
			makeUser('jedmund', 'Justin'),
			makeUser('kona', 'Konami')
		])
		const screen = render(NavUserSearch, { onClose: () => {} })
		const input = screen.getByRole('textbox')
		await input.fill('je')
		await settle(350)

		input.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
		await tick()
		input.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
		await tick()

		expect(gotoMock).toHaveBeenCalledWith('/kona')
	})

	it('Escape calls onClose', async () => {
		const onClose = vi.fn()
		const screen = render(NavUserSearch, { onClose })
		const input = screen.getByRole('textbox')
		input.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
		await tick()
		expect(onClose).toHaveBeenCalled()
	})
})
