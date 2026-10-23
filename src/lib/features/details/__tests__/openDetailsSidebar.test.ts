import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { GridCharacter } from '$lib/types/api/party'

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('$lib/stores/partyStore.svelte', () => ({
	partyStore: { updateCharacter: vi.fn(), updateWeapon: vi.fn(), getItem: vi.fn() }
}))
vi.mock('$lib/components/sidebar/DetailsSidebar.svelte', () => ({ default: () => {} }))
vi.mock('$lib/components/sidebar/EditWeaponPane.svelte', () => ({ default: () => {} }))
vi.mock('$lib/components/sidebar/EditCharacterPane.svelte', () => ({ default: () => {} }))
vi.mock('$lib/components/sidebar/EditSummonPane.svelte', () => ({ default: () => {} }))

const { toast } = await import('svelte-sonner')
const { partyStore } = await import('$lib/stores/partyStore.svelte')
const { sidebar } = await import('$lib/stores/sidebar.svelte')
const { openCharacterEditSidebar } = await import('../openDetailsSidebar.svelte')

const character = {
	id: 'gc-1',
	position: 1,
	character: { name: { en: 'Rosamia', ja: 'ロザミア' } }
} as unknown as GridCharacter

async function save(updates: Partial<GridCharacter> = { perpetuity: true }) {
	const onSave = sidebar.paneStack.panes.at(-1)?.props?.onSave
	await onSave(updates)
}

beforeEach(() => {
	vi.useFakeTimers()
	vi.clearAllMocks()
	sidebar.close()
	vi.advanceTimersByTime(300)
})

afterEach(() => {
	vi.useRealTimers()
})

describe('openCharacterEditSidebar save handling', () => {
	it('closes the pane after a successful save', async () => {
		const onSaveCharacter = vi.fn().mockResolvedValue(undefined)
		openCharacterEditSidebar(character, onSaveCharacter)

		await save()

		expect(onSaveCharacter).toHaveBeenCalledWith('gc-1', { perpetuity: true })
		expect(sidebar.isOpen).toBe(false)
	})

	it('keeps the pane open when the save callback fails', async () => {
		const onSaveCharacter = vi.fn().mockRejectedValue(new Error('500'))
		openCharacterEditSidebar(character, onSaveCharacter)

		await save()

		expect(sidebar.isOpen).toBe(true)
		// The gridService callback shows its own toast.
		expect(toast.error).not.toHaveBeenCalled()
	})

	it('shows an error and keeps the pane open when the store fallback fails', async () => {
		vi.mocked(partyStore.updateCharacter).mockRejectedValue(new Error('500'))
		openCharacterEditSidebar(character, undefined)

		await save()

		expect(toast.error).toHaveBeenCalledTimes(1)
		expect(sidebar.isOpen).toBe(true)
	})
})
