import { describe, expect, it } from 'vitest'
import { resolveDetailTab } from './detailTab'

describe('resolveDetailTab', () => {
	it('defaults to info', () => {
		expect(resolveDetailTab(null, false)).toBe('info')
		expect(resolveDetailTab('', true)).toBe('info')
	})

	it('keeps the requested tab', () => {
		expect(resolveDetailTab('images', false)).toBe('images')
		expect(resolveDetailTab('skills', true)).toBe('skills')
	})

	it('shows raw data to editors', () => {
		expect(resolveDetailTab('raw', true)).toBe('raw')
	})

	it('falls back to info for non-editors on the raw tab', () => {
		expect(resolveDetailTab('raw', false)).toBe('info')
	})
})
