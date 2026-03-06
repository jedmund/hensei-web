import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Component } from 'svelte'

const { sidebar } = await import('../sidebar.svelte')

const DummyComponent = {} as Component<any, any, any>

beforeEach(() => {
	vi.useFakeTimers()
	// Reset sidebar state between tests
	sidebar.close()
	vi.advanceTimersByTime(300)
})

afterEach(() => {
	vi.useRealTimers()
})

// ============================================================================
// open / close / toggle
// ============================================================================

describe('open / close / toggle', () => {
	it('starts closed', () => {
		expect(sidebar.isOpen).toBe(false)
	})

	it('open() sets open state', () => {
		sidebar.open()
		expect(sidebar.isOpen).toBe(true)
	})

	it('close() sets closed and clears pane stack after delay', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		sidebar.close()
		expect(sidebar.isOpen).toBe(false)
		// Pane stack not yet cleared
		expect(sidebar.paneStack.depth).toBe(1)
		vi.advanceTimersByTime(300)
		expect(sidebar.paneStack.depth).toBe(0)
	})

	it('close() clears activeItemId', () => {
		sidebar.openWithComponent('Test', DummyComponent, { item: { id: 'item-1' } })
		expect(sidebar.activeItemId).toBe('item-1')
		sidebar.close()
		expect(sidebar.activeItemId).toBeUndefined()
	})

	it('toggle() opens when closed', () => {
		sidebar.toggle()
		expect(sidebar.isOpen).toBe(true)
	})

	it('toggle() closes when open', () => {
		sidebar.open()
		sidebar.toggle()
		expect(sidebar.isOpen).toBe(false)
	})
})

// ============================================================================
// openWithComponent
// ============================================================================

describe('openWithComponent', () => {
	it('creates pane config and opens', () => {
		sidebar.openWithComponent('Details', DummyComponent, { foo: 1 })
		expect(sidebar.isOpen).toBe(true)
		expect(sidebar.title).toBe('Details')
		expect(sidebar.component).toBe(DummyComponent)
		expect(sidebar.componentProps).toEqual({ foo: 1 })
	})

	it('handles boolean backward compat for 4th param', () => {
		sidebar.openWithComponent('Title', DummyComponent, undefined, false)
		expect(sidebar.scrollable).toBe(false)
	})

	it('handles options object for 4th param', () => {
		const onsave = vi.fn()
		sidebar.openWithComponent('Title', DummyComponent, undefined, {
			scrollable: false,
			onsave,
			saveLabel: 'Save',
			element: 'fire'
		})
		expect(sidebar.scrollable).toBe(false)
		expect(sidebar.onsave).toBe(onsave)
		expect(sidebar.saveLabel).toBe('Save')
		expect(sidebar.element).toBe('fire')
	})

	it('extracts activeItemId from props.item.id', () => {
		sidebar.openWithComponent('Test', DummyComponent, { item: { id: 42 } })
		expect(sidebar.activeItemId).toBe('42')
	})

	it('cancels pending clear from previous close', () => {
		sidebar.openWithComponent('First', DummyComponent)
		sidebar.close()
		// Re-open before the 300ms clear fires
		sidebar.openWithComponent('Second', DummyComponent)
		vi.advanceTimersByTime(300)
		// Pane stack should have the new pane, not be cleared
		expect(sidebar.paneStack.depth).toBe(1)
		expect(sidebar.title).toBe('Second')
	})
})

// ============================================================================
// push / pop delegation
// ============================================================================

describe('push / pop', () => {
	it('push delegates to paneStack', () => {
		sidebar.openWithComponent('Root', DummyComponent)
		vi.advanceTimersByTime(300)
		sidebar.push({ id: 'child', title: 'Child', component: DummyComponent })
		expect(sidebar.paneStack.depth).toBe(2)
	})

	it('pop delegates to paneStack', () => {
		sidebar.openWithComponent('Root', DummyComponent)
		vi.advanceTimersByTime(300)
		sidebar.push({ id: 'child', title: 'Child', component: DummyComponent })
		vi.advanceTimersByTime(300)
		sidebar.pop()
		vi.advanceTimersByTime(300)
		expect(sidebar.paneStack.depth).toBe(1)
	})
})

// ============================================================================
// setAction / clearAction
// ============================================================================

describe('setAction / clearAction', () => {
	it('sets action on current pane', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		const handler = vi.fn()
		sidebar.setAction(handler, 'Save', 'water')
		expect(sidebar.onsave).toBe(handler)
		expect(sidebar.saveLabel).toBe('Save')
		expect(sidebar.element).toBe('water')
	})

	it('sets disabled action when handler is undefined', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		sidebar.setAction(undefined, 'Save')
		const pane = sidebar.paneStack.currentPane
		expect(pane?.action?.disabled).toBe(true)
	})

	it('clearAction removes action', () => {
		sidebar.openWithComponent('Test', DummyComponent, undefined, { onsave: vi.fn(), saveLabel: 'Done' })
		sidebar.clearAction()
		expect(sidebar.onsave).toBeUndefined()
	})
})

// ============================================================================
// setOverflowMenu / clearOverflowMenu
// ============================================================================

describe('setOverflowMenu / clearOverflowMenu', () => {
	it('sets overflow menu on current pane', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		const items = [{ label: 'Delete', handler: vi.fn(), variant: 'danger' as const }]
		sidebar.setOverflowMenu(items)
		expect(sidebar.paneStack.currentPane?.overflowMenu).toEqual(items)
	})

	it('clearOverflowMenu removes menu', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		sidebar.setOverflowMenu([{ label: 'X', handler: vi.fn() }])
		sidebar.clearOverflowMenu()
		expect(sidebar.paneStack.currentPane?.overflowMenu).toBeUndefined()
	})
})

// ============================================================================
// Getters
// ============================================================================

describe('getters', () => {
	it('scrollable defaults to true', () => {
		sidebar.openWithComponent('Test', DummyComponent)
		expect(sidebar.scrollable).toBe(true)
	})

	it('content always returns undefined', () => {
		expect(sidebar.content).toBeUndefined()
	})

	it('onback returns root pane onback', () => {
		const onback = vi.fn()
		sidebar.openWithComponent('Test', DummyComponent, undefined, { onback })
		expect(sidebar.onback).toBe(onback)
	})
})
