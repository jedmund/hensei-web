import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { PaneConfig } from '../paneStack.svelte'

const { PaneStackStore } = await import('../paneStack.svelte')

function makePane(id: string, overrides: Partial<PaneConfig> = {}): PaneConfig {
	return {
		id,
		title: `Pane ${id}`,
		component: {} as any,
		...overrides
	}
}

let stack: InstanceType<typeof PaneStackStore>

beforeEach(() => {
	vi.useFakeTimers()
	stack = new PaneStackStore()
})

afterEach(() => {
	vi.useRealTimers()
})

// ============================================================================
// push
// ============================================================================

describe('push', () => {
	it('adds a pane to the stack', () => {
		stack.push(makePane('a'))
		expect(stack.depth).toBe(1)
		expect(stack.currentPane?.id).toBe('a')
	})

	it('sets animation state during push', () => {
		stack.push(makePane('a'))
		expect(stack.isAnimating).toBe(true)
		expect(stack.animationDirection).toBe('push')
	})

	it('clears animation after 300ms', () => {
		stack.push(makePane('a'))
		vi.advanceTimersByTime(300)
		expect(stack.isAnimating).toBe(false)
		expect(stack.animationDirection).toBeNull()
	})

	it('blocks push during animation', () => {
		stack.push(makePane('a'))
		stack.push(makePane('b'))
		expect(stack.depth).toBe(1)
	})

	it('allows push after animation completes', () => {
		stack.push(makePane('a'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('b'))
		expect(stack.depth).toBe(2)
	})
})

// ============================================================================
// pop
// ============================================================================

describe('pop', () => {
	it('returns false on empty stack', () => {
		expect(stack.pop()).toBe(false)
	})

	it('returns false on single pane without onback', () => {
		stack.reset(makePane('root'))
		expect(stack.pop()).toBe(false)
		expect(stack.depth).toBe(1)
	})

	it('calls root onback when single pane has it', () => {
		const onback = vi.fn()
		stack.reset(makePane('root', { onback }))
		stack.pop()
		expect(onback).toHaveBeenCalledOnce()
	})

	it('removes top pane after animation', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('child'))
		vi.advanceTimersByTime(300)

		expect(stack.pop()).toBe(true)
		vi.advanceTimersByTime(300)
		expect(stack.depth).toBe(1)
		expect(stack.currentPane?.id).toBe('root')
	})

	it('blocks pop during animation', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('child'))
		vi.advanceTimersByTime(300)

		stack.pop()
		expect(stack.pop()).toBe(false)
	})
})

// ============================================================================
// popTo / popToRoot
// ============================================================================

describe('popTo', () => {
	it('pops to a specific pane id', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('mid'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('top'))
		vi.advanceTimersByTime(300)

		stack.popTo('root')
		vi.advanceTimersByTime(300)
		expect(stack.depth).toBe(1)
		expect(stack.currentPane?.id).toBe('root')
	})

	it('no-op if id not found', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('child'))
		vi.advanceTimersByTime(300)

		stack.popTo('nonexistent')
		expect(stack.depth).toBe(2)
	})

	it('no-op if already on target pane', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('top'))
		vi.advanceTimersByTime(300)

		stack.popTo('top')
		expect(stack.depth).toBe(2)
	})
})

describe('popToRoot', () => {
	it('pops all but root', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('a'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('b'))
		vi.advanceTimersByTime(300)

		stack.popToRoot()
		vi.advanceTimersByTime(300)
		expect(stack.depth).toBe(1)
	})

	it('no-op if only root', () => {
		stack.reset(makePane('root'))
		stack.popToRoot()
		expect(stack.depth).toBe(1)
	})
})

// ============================================================================
// clear / reset
// ============================================================================

describe('clear', () => {
	it('empties the stack', () => {
		stack.push(makePane('a'))
		stack.clear()
		expect(stack.depth).toBe(0)
		expect(stack.isEmpty).toBe(true)
		expect(stack.isAnimating).toBe(false)
	})
})

describe('reset', () => {
	it('replaces stack with single pane', () => {
		stack.push(makePane('a'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('b'))
		vi.advanceTimersByTime(300)

		stack.reset(makePane('new-root'))
		expect(stack.depth).toBe(1)
		expect(stack.currentPane?.id).toBe('new-root')
		expect(stack.isAnimating).toBe(false)
	})
})

// ============================================================================
// updateCurrentProps
// ============================================================================

describe('updateCurrentProps', () => {
	it('merges props into current pane', () => {
		stack.reset(makePane('root', { props: { foo: 1 } }))
		stack.updateCurrentProps({ bar: 2 })
		expect(stack.currentPane?.props).toEqual({ foo: 1, bar: 2 })
	})

	it('no-op on empty stack', () => {
		stack.updateCurrentProps({ bar: 2 })
		expect(stack.depth).toBe(0)
	})
})

// ============================================================================
// Getters
// ============================================================================

describe('getters', () => {
	it('isEmpty is true for empty stack', () => {
		expect(stack.isEmpty).toBe(true)
	})

	it('isEmpty is false when panes exist', () => {
		stack.push(makePane('a'))
		expect(stack.isEmpty).toBe(false)
	})

	it('canGoBack is false with single pane and no onback', () => {
		stack.reset(makePane('root'))
		expect(stack.canGoBack).toBe(false)
	})

	it('canGoBack is true with single pane that has onback', () => {
		stack.reset(makePane('root', { onback: () => {} }))
		expect(stack.canGoBack).toBe(true)
	})

	it('canGoBack is true with multiple panes', () => {
		stack.reset(makePane('root'))
		vi.advanceTimersByTime(300)
		stack.push(makePane('child'))
		expect(stack.canGoBack).toBe(true)
	})
})
