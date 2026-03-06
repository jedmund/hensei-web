import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let getItemMock: ReturnType<typeof vi.fn>
let setItemMock: ReturnType<typeof vi.fn>

beforeEach(() => {
	getItemMock = vi.fn().mockReturnValue(null)
	setItemMock = vi.fn()

	const localStorage = {
		getItem: getItemMock,
		setItem: setItemMock,
		removeItem: vi.fn(),
		clear: vi.fn()
	}

	vi.stubGlobal('localStorage', localStorage)
	vi.stubGlobal('window', { localStorage })
	vi.resetModules()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('defaults', () => {
	it('returns grid when no stored value', async () => {
		const { viewMode } = await import('../viewMode.svelte')
		expect(viewMode.collectionView).toBe('grid')
		expect(viewMode.modalView).toBe('grid')
	})
})

describe('loads from localStorage', () => {
	it('reads stored collection view', async () => {
		getItemMock.mockImplementation((key: string) =>
			key === 'collection-view-mode' ? 'list' : null
		)
		const { viewMode } = await import('../viewMode.svelte')
		expect(viewMode.collectionView).toBe('list')
	})

	it('reads stored modal view', async () => {
		getItemMock.mockImplementation((key: string) =>
			key === 'modal-view-mode' ? 'list' : null
		)
		const { viewMode } = await import('../viewMode.svelte')
		expect(viewMode.modalView).toBe('list')
	})

	it('ignores invalid stored values', async () => {
		getItemMock.mockReturnValue('invalid')
		const { viewMode } = await import('../viewMode.svelte')
		expect(viewMode.collectionView).toBe('grid')
		expect(viewMode.modalView).toBe('grid')
	})
})

describe('setCollectionView', () => {
	it('updates state and persists to localStorage', async () => {
		const { viewMode } = await import('../viewMode.svelte')
		viewMode.setCollectionView('list')
		expect(viewMode.collectionView).toBe('list')
		expect(setItemMock).toHaveBeenCalledWith('collection-view-mode', 'list')
	})
})

describe('setModalView', () => {
	it('updates state and persists to localStorage', async () => {
		const { viewMode } = await import('../viewMode.svelte')
		viewMode.setModalView('list')
		expect(viewMode.modalView).toBe('list')
		expect(setItemMock).toHaveBeenCalledWith('modal-view-mode', 'list')
	})
})
