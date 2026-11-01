import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	ScoutUserSearch,
	SCOUT_SEARCH_DELAY_MS,
	type ScoutUserOption
} from '../scoutUserSearch.svelte'

const alice: ScoutUserOption = {
	id: 'u1',
	username: 'alice',
	avatar: { picture: 'gran', element: 'fire' }
}
const bob: ScoutUserOption = { id: 'u2', username: 'bob' }

describe('ScoutUserSearch', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('searches once typing pauses and opens the results', async () => {
		const searchUsers = vi.fn().mockResolvedValue([alice, bob])
		const search = new ScoutUserSearch(searchUsers)

		search.handleInput('al')
		search.handleInput('ali')
		expect(search.inputValue).toBe('ali')
		expect(searchUsers).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(SCOUT_SEARCH_DELAY_MS)

		expect(searchUsers).toHaveBeenCalledTimes(1)
		expect(searchUsers).toHaveBeenCalledWith('ali')
		expect(search.searchResults).toEqual([alice, bob])
		expect(search.comboboxItems).toEqual([
			{ value: 'u1', label: 'alice' },
			{ value: 'u2', label: 'bob' }
		])
		expect(search.comboboxOpen).toBe(true)
		expect(search.isLoading).toBe(false)
	})

	it('does not search for fewer than two characters', async () => {
		const searchUsers = vi.fn()
		const search = new ScoutUserSearch(searchUsers)
		search.searchResults = [alice]

		search.handleInput('a')
		await vi.advanceTimersByTimeAsync(SCOUT_SEARCH_DELAY_MS)

		expect(searchUsers).not.toHaveBeenCalled()
		expect(search.searchResults).toEqual([])
	})

	it('keeps the combobox closed when nothing matches', async () => {
		const search = new ScoutUserSearch(vi.fn().mockResolvedValue([]))
		search.handleInput('zzz')
		await vi.advanceTimersByTimeAsync(SCOUT_SEARCH_DELAY_MS)
		expect(search.comboboxOpen).toBe(false)
	})

	it('clears the results when the search fails', async () => {
		const search = new ScoutUserSearch(vi.fn().mockRejectedValue(new Error('offline')))
		search.searchResults = [alice]
		await search.search('alice')
		expect(search.searchResults).toEqual([])
		expect(search.isLoading).toBe(false)
	})

	it('picks a user from the results', async () => {
		const search = new ScoutUserSearch(vi.fn().mockResolvedValue([alice, bob]))
		await search.search('ali')

		search.select('u2')

		expect(search.selectedUserId).toBe('u2')
		expect(search.foundUser).toEqual({
			id: 'u2',
			username: 'bob',
			avatar: { picture: '', element: '' }
		})
		expect(search.inputValue).toBe('bob')
		expect(search.comboboxOpen).toBe(false)
	})

	it('drops the pick when the selection or the input is cleared', async () => {
		const search = new ScoutUserSearch(vi.fn().mockResolvedValue([alice]))
		await search.search('ali')
		search.select('u1')

		search.select('')
		expect(search.foundUser).toBeNull()

		search.select('u1')
		search.handleInput('  ')
		expect(search.selectedUserId).toBe('')
		expect(search.foundUser).toBeNull()
	})

	it('resets to an empty, closed search', async () => {
		const search = new ScoutUserSearch(vi.fn().mockResolvedValue([alice]))
		await search.search('ali')
		search.select('u1')
		search.comboboxOpen = true

		search.reset()

		expect(search.searchResults).toEqual([])
		expect(search.selectedUserId).toBe('')
		expect(search.inputValue).toBe('')
		expect(search.foundUser).toBeNull()
		expect(search.comboboxOpen).toBe(false)
	})
})
