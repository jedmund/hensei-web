import { describe, it, expect, beforeEach } from 'vitest'
import { createSelectionModeContext } from '../selectionMode.svelte'

let ctx: ReturnType<typeof createSelectionModeContext>

beforeEach(() => {
	ctx = createSelectionModeContext()
})

describe('enter / exit', () => {
	it('starts inactive', () => {
		expect(ctx.isActive).toBe(false)
		expect(ctx.entityType).toBeNull()
		expect(ctx.selectedCount).toBe(0)
	})

	it('enter activates with entity type', () => {
		ctx.enter('characters')
		expect(ctx.isActive).toBe(true)
		expect(ctx.entityType).toBe('characters')
	})

	it('enter clears previous selection', () => {
		ctx.enter('weapons')
		ctx.toggle('w-1')
		ctx.enter('characters')
		expect(ctx.selectedCount).toBe(0)
		expect(ctx.entityType).toBe('characters')
	})

	it('exit deactivates and clears', () => {
		ctx.enter('characters')
		ctx.toggle('c-1')
		ctx.exit()
		expect(ctx.isActive).toBe(false)
		expect(ctx.entityType).toBeNull()
		expect(ctx.selectedCount).toBe(0)
	})
})

describe('toggle', () => {
	it('adds item when not selected', () => {
		ctx.enter('characters')
		ctx.toggle('c-1')
		expect(ctx.isSelected('c-1')).toBe(true)
		expect(ctx.selectedCount).toBe(1)
	})

	it('removes item when already selected', () => {
		ctx.enter('characters')
		ctx.toggle('c-1')
		ctx.toggle('c-1')
		expect(ctx.isSelected('c-1')).toBe(false)
		expect(ctx.selectedCount).toBe(0)
	})
})

describe('selectAll / clearSelection', () => {
	it('selectAll replaces selection', () => {
		ctx.enter('weapons')
		ctx.toggle('w-1')
		ctx.selectAll(['w-2', 'w-3', 'w-4'])
		expect(ctx.selectedCount).toBe(3)
		expect(ctx.isSelected('w-1')).toBe(false)
		expect(ctx.isSelected('w-2')).toBe(true)
	})

	it('clearSelection empties without exiting', () => {
		ctx.enter('summons')
		ctx.selectAll(['s-1', 's-2'])
		ctx.clearSelection()
		expect(ctx.selectedCount).toBe(0)
		expect(ctx.isActive).toBe(true)
	})
})

describe('isSelected', () => {
	it('returns false for unselected item', () => {
		ctx.enter('characters')
		expect(ctx.isSelected('c-99')).toBe(false)
	})
})
