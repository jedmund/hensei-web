import { describe, expect, it, vi } from 'vitest'
import { moveItem, useDragReorder } from './dragReorder.svelte'

const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
	({ key: k, altKey: false, preventDefault: vi.fn(), ...extra }) as unknown as KeyboardEvent

function setup(withPreview = true) {
	let items = ['a', 'b', 'c', 'd']
	const onReorder = vi.fn((next: string[]) => {
		items = next
	})
	const onPreview = vi.fn((next: string[]) => {
		items = next
	})
	const drag = useDragReorder<string>({
		items: () => items,
		onReorder,
		...(withPreview ? { onPreview } : {})
	})
	return { drag, onReorder, onPreview, items: () => items }
}

describe('moveItem', () => {
	it('moves one item and leaves the input alone', () => {
		const list = ['a', 'b', 'c']
		expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a'])
		expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b'])
		expect(list).toEqual(['a', 'b', 'c'])
	})
})

describe('useDragReorder: keyboard', () => {
	it('picks up with Space, previews arrow moves, and commits on drop', () => {
		const { drag, onReorder, onPreview, items } = setup()
		expect(drag.onKeydown(key(' '), 1)).toEqual({ kind: 'grab', index: 1 })
		expect(drag.grabbedIndex).toBe(1)
		expect(drag.onKeydown(key('ArrowDown'), 1)).toEqual({ kind: 'move', index: 2 })
		expect(drag.onKeydown(key('ArrowDown'), 2)).toEqual({ kind: 'move', index: 3 })
		expect(onPreview).toHaveBeenLastCalledWith(['a', 'c', 'd', 'b'])
		expect(onReorder).not.toHaveBeenCalled()

		expect(drag.onKeydown(key('Enter'), 3)).toEqual({ kind: 'drop', index: 3 })
		expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'd', 'b'], 1, 3)
		expect(items()).toEqual(['a', 'c', 'd', 'b'])
		expect(drag.grabbedIndex).toBeNull()
	})

	it('puts the row back on Escape without saving', () => {
		const { drag, onReorder, items } = setup()
		drag.onKeydown(key(' '), 0)
		drag.onKeydown(key('ArrowDown'), 0)
		expect(items()).toEqual(['b', 'a', 'c', 'd'])
		expect(drag.onKeydown(key('Escape'), 1)).toEqual({ kind: 'cancel', index: 0 })
		expect(items()).toEqual(['a', 'b', 'c', 'd'])
		expect(onReorder).not.toHaveBeenCalled()
	})

	it("doesn't save a drop where the row started, or move past the ends", () => {
		const { drag, onReorder } = setup()
		drag.onKeydown(key(' '), 0)
		expect(drag.onKeydown(key('ArrowUp'), 0)).toBeNull()
		drag.onKeydown(key(' '), 0)
		expect(onReorder).not.toHaveBeenCalled()
	})

	it('moves one place at once with Alt+arrow', () => {
		const { drag, onReorder } = setup()
		expect(drag.onKeydown(key('ArrowUp', { altKey: true }), 2)).toEqual({ kind: 'move', index: 1 })
		expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b', 'd'], 2, 1)
		expect(drag.onKeydown(key('ArrowDown'), 0)).toBeNull()
	})

	it('commits each step when the caller has no preview', () => {
		const { drag, onReorder } = setup(false)
		drag.onKeydown(key(' '), 0)
		drag.onKeydown(key('ArrowDown'), 0)
		expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c', 'd'], 0, 1)
	})
})
