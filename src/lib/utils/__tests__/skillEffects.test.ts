import { describe, expect, it, vi } from 'vitest'

vi.mock('$lib/paraglide/runtime.js', () => ({ getLocale: () => 'en' }))

import { effectStatusName } from '../skillEffects'

const jammed = { id: 's1', name: { en: 'Jammed', ja: 'ジャミング' } }

describe('effectStatusName', () => {
	it("shows the skill's own name for the status in English", () => {
		expect(effectStatusName({ label: 'Guilty Break', status: jammed }, 'en')).toBe('Guilty Break')
	})

	it('falls back to the status name when there is no label', () => {
		expect(effectStatusName({ label: null, status: jammed }, 'en')).toBe('Jammed')
		expect(effectStatusName({ status: jammed }, 'en')).toBe('Jammed')
	})

	it("shows the linked status's Japanese name until Japanese labels exist", () => {
		expect(effectStatusName({ label: 'Guilty Break', status: jammed }, 'ja')).toBe('ジャミング')
	})

	it('falls back across languages when a name is missing', () => {
		const untranslated = { id: 's2', name: { en: 'Jammed', ja: '' } }
		expect(effectStatusName({ label: 'Guilty Break', status: untranslated }, 'ja')).toBe(
			'Guilty Break'
		)
		expect(effectStatusName({ label: null, status: null }, 'en')).toBeUndefined()
	})

	it('uses the current locale by default', () => {
		expect(effectStatusName({ label: 'Guilty Break', status: jammed })).toBe('Guilty Break')
	})
})
