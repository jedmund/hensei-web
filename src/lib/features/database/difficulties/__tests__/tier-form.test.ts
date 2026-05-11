import { describe, it, expect } from 'vitest'
import { buildTierPayload, validateTierForm, type TierFormInput } from '../tier-form'

const baseInput: TierFormInput = {
	name: 'Endgame',
	slug: 'endgame',
	color: '#86C5A8',
	description: '',
	minScore: 80,
	maxScore: 100,
	sortOrder: 30
}

describe('validateTierForm', () => {
	it('accepts a fully populated, in-range input', () => {
		expect(validateTierForm(baseInput).ok).toBe(true)
	})

	it('flags an empty name (whitespace-only too)', () => {
		const res = validateTierForm({ ...baseInput, name: '   ' })
		expect(res.ok).toBe(false)
		if (!res.ok) expect(res.errors.name).toBeDefined()
	})

	it('flags an empty slug', () => {
		const res = validateTierForm({ ...baseInput, slug: '' })
		expect(res.ok).toBe(false)
		if (!res.ok) expect(res.errors.slug).toBeDefined()
	})

	it('rejects a negative minScore', () => {
		const res = validateTierForm({ ...baseInput, minScore: -1 })
		expect(res.ok).toBe(false)
		if (!res.ok) expect(res.errors.range).toBeDefined()
	})

	it('rejects a maxScore over 100', () => {
		const res = validateTierForm({ ...baseInput, maxScore: 101 })
		expect(res.ok).toBe(false)
		if (!res.ok) expect(res.errors.range).toBeDefined()
	})

	it('rejects when max is not strictly greater than min', () => {
		const equal = validateTierForm({ ...baseInput, minScore: 50, maxScore: 50 })
		const inverted = validateTierForm({ ...baseInput, minScore: 80, maxScore: 70 })
		expect(equal.ok).toBe(false)
		expect(inverted.ok).toBe(false)
	})

	it('rejects NaN scores (defensive: form inputs can leave fields as NaN)', () => {
		const res = validateTierForm({ ...baseInput, minScore: Number.NaN, maxScore: 100 })
		expect(res.ok).toBe(false)
		if (!res.ok) expect(res.errors.range).toBeDefined()
	})

	it('accepts the full 0–100 boundary', () => {
		expect(validateTierForm({ ...baseInput, minScore: 0, maxScore: 100 }).ok).toBe(true)
	})

	it('collects multiple errors at once (does not bail on the first miss)', () => {
		const res = validateTierForm({ ...baseInput, name: '', slug: '', maxScore: 200 })
		expect(res.ok).toBe(false)
		if (!res.ok) {
			expect(res.errors.name).toBeDefined()
			expect(res.errors.slug).toBeDefined()
			expect(res.errors.range).toBeDefined()
		}
	})
})

describe('buildTierPayload', () => {
	it('trims name and slug', () => {
		const payload = buildTierPayload({ ...baseInput, name: '  Endgame  ', slug: '  endgame ' })
		expect(payload.name).toBe('Endgame')
		expect(payload.slug).toBe('endgame')
	})

	it('drops an empty description (undefined, not empty string)', () => {
		const payload = buildTierPayload({ ...baseInput, description: '   ' })
		expect(payload.description).toBeUndefined()
	})

	it('keeps a populated description (trimmed)', () => {
		const payload = buildTierPayload({ ...baseInput, description: '  endgame parties  ' })
		expect(payload.description).toBe('endgame parties')
	})

	it('forwards color verbatim (no normalization)', () => {
		const payload = buildTierPayload({ ...baseInput, color: '#1A1A3A' })
		expect(payload.color).toBe('#1A1A3A')
	})

	it('omits imageKey by default', () => {
		const payload = buildTierPayload(baseInput)
		expect('imageKey' in payload).toBe(false)
	})

	it('sends imageKey: null when removeIcon is set and no new file is staged', () => {
		const payload = buildTierPayload(baseInput, { removeIcon: true, hasIconFile: false })
		expect(payload.imageKey).toBeNull()
	})

	it('does NOT send imageKey: null when a new icon file is staged (upload supplies it)', () => {
		const payload = buildTierPayload(baseInput, { removeIcon: true, hasIconFile: true })
		expect('imageKey' in payload).toBe(false)
	})

	it('does NOT send imageKey when removeIcon is false even with hasIconFile', () => {
		const payload = buildTierPayload(baseInput, { removeIcon: false, hasIconFile: true })
		expect('imageKey' in payload).toBe(false)
	})

	it('preserves min/max/sort exactly (no coercion or rounding)', () => {
		const payload = buildTierPayload({ ...baseInput, minScore: 0, maxScore: 100, sortOrder: 0 })
		expect(payload.minScore).toBe(0)
		expect(payload.maxScore).toBe(100)
		expect(payload.sortOrder).toBe(0)
	})
})
