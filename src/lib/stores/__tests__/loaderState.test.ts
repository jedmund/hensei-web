import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { LoaderState, LoopTracker, STATUS } = await import('../loaderState.svelte')

// ============================================================================
// LoaderState
// ============================================================================

describe('LoaderState', () => {
	let state: InstanceType<typeof LoaderState>

	beforeEach(() => {
		state = new LoaderState()
	})

	it('starts as READY with isFirstLoad=true', () => {
		expect(state.status).toBe(STATUS.READY)
		expect(state.isFirstLoad).toBe(true)
	})

	it('loaded() transitions to READY and clears isFirstLoad', () => {
		state.status = STATUS.LOADING
		state.loaded()
		expect(state.status).toBe(STATUS.READY)
		expect(state.isFirstLoad).toBe(false)
	})

	it('complete() transitions to COMPLETE', () => {
		state.status = STATUS.LOADING
		state.complete()
		expect(state.status).toBe(STATUS.COMPLETE)
		expect(state.isFirstLoad).toBe(false)
	})

	it('error() transitions to ERROR', () => {
		state.status = STATUS.LOADING
		state.error()
		expect(state.status).toBe(STATUS.ERROR)
	})

	it('reset() restores initial state', () => {
		state.status = STATUS.COMPLETE
		state.isFirstLoad = false
		state.reset()
		expect(state.status).toBe(STATUS.READY)
		expect(state.isFirstLoad).toBe(true)
	})

	it('loaded() is idempotent on isFirstLoad', () => {
		state.loaded()
		expect(state.isFirstLoad).toBe(false)
		state.loaded()
		expect(state.isFirstLoad).toBe(false)
	})
})

// ============================================================================
// LoopTracker
// ============================================================================

describe('LoopTracker', () => {
	let tracker: InstanceType<typeof LoopTracker>

	beforeEach(() => {
		vi.useFakeTimers()
		tracker = new LoopTracker()
	})

	afterEach(() => {
		tracker.destroy()
		vi.useRealTimers()
	})

	it('starts without cooling off', () => {
		expect(tracker.coolingOff).toBe(false)
	})

	it('does not cool off under threshold', () => {
		for (let i = 0; i < 4; i++) tracker.track()
		expect(tracker.coolingOff).toBe(false)
	})

	it('cools off at threshold (5 calls)', () => {
		for (let i = 0; i < 5; i++) tracker.track()
		expect(tracker.coolingOff).toBe(true)
	})

	it('resets cooloff after cooldown period (3000ms)', () => {
		for (let i = 0; i < 5; i++) tracker.track()
		expect(tracker.coolingOff).toBe(true)
		vi.advanceTimersByTime(3000)
		expect(tracker.coolingOff).toBe(false)
	})

	it('resets count after detection timeout (2000ms)', () => {
		for (let i = 0; i < 4; i++) tracker.track()
		vi.advanceTimersByTime(2000)
		// Count should have reset, so one more call shouldn't trigger cooloff
		tracker.track()
		expect(tracker.coolingOff).toBe(false)
	})

	it('destroy clears timers without error', () => {
		tracker.track()
		tracker.destroy()
		// Advancing timers after destroy should not cause issues
		vi.advanceTimersByTime(5000)
		expect(tracker.coolingOff).toBe(false)
	})

	it('accepts custom thresholds', () => {
		const custom = new LoopTracker(3, 1000, 500)
		for (let i = 0; i < 3; i++) custom.track()
		expect(custom.coolingOff).toBe(true)
		vi.advanceTimersByTime(500)
		expect(custom.coolingOff).toBe(false)
		custom.destroy()
	})
})
