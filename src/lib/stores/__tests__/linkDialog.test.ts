import { describe, it, expect, vi } from 'vitest'

const { linkDialogState } = await import('../linkDialog.svelte')

describe('linkDialogState', () => {
	it('starts closed', () => {
		expect(linkDialogState.open).toBe(false)
		expect(linkDialogState.editor).toBeNull()
		expect(linkDialogState.initialUrl).toBe('')
	})

	it('show() opens the dialog with editor and initial URL', () => {
		const mockEditor = { chain: vi.fn() } as never
		linkDialogState.show(mockEditor, 'https://example.com')

		expect(linkDialogState.open).toBe(true)
		expect(linkDialogState.editor).toBe(mockEditor)
		expect(linkDialogState.initialUrl).toBe('https://example.com')
	})

	it('show() defaults initialUrl to empty string', () => {
		const mockEditor = { chain: vi.fn() } as never
		linkDialogState.show(mockEditor)

		expect(linkDialogState.initialUrl).toBe('')
	})

	it('close() resets all state', () => {
		const mockEditor = { chain: vi.fn() } as never
		linkDialogState.show(mockEditor, 'https://example.com')
		linkDialogState.close()

		expect(linkDialogState.open).toBe(false)
		expect(linkDialogState.editor).toBeNull()
		expect(linkDialogState.initialUrl).toBe('')
	})

	it('apply() calls toggleLink on editor and closes', () => {
		const run = vi.fn()
		const toggleLink = vi.fn().mockReturnValue({ run })
		const focus = vi.fn().mockReturnValue({ toggleLink })
		const chain = vi.fn().mockReturnValue({ focus })
		const mockEditor = { chain } as never

		linkDialogState.show(mockEditor)
		linkDialogState.apply('https://example.com')

		expect(chain).toHaveBeenCalled()
		expect(focus).toHaveBeenCalled()
		expect(toggleLink).toHaveBeenCalledWith({ href: 'https://example.com' })
		expect(run).toHaveBeenCalled()
		expect(linkDialogState.open).toBe(false)
	})

	it('apply() does nothing with empty URL', () => {
		const chain = vi.fn()
		const mockEditor = { chain } as never

		linkDialogState.show(mockEditor)
		linkDialogState.apply('')

		expect(chain).not.toHaveBeenCalled()
		expect(linkDialogState.open).toBe(false)
	})
})
