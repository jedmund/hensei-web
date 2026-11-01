import { describe, it, expect } from 'vitest'
import * as m from '$lib/paraglide/messages'
import { toCrewInput, validateCrewForm } from '../crewForm'

const valid = { name: 'Siero Knights', gamertag: 'SK', description: '' }

describe('validateCrewForm', () => {
	it('accepts a name with blank optional fields', () => {
		expect(validateCrewForm(valid)).toEqual({})
	})

	it('requires a name that is not just whitespace', () => {
		expect(validateCrewForm({ ...valid, name: '   ' })).toEqual({
			name: m.crew_error_name_required()
		})
	})

	it('limits the name to 100 characters', () => {
		expect(validateCrewForm({ ...valid, name: 'a'.repeat(100) })).toEqual({})
		expect(validateCrewForm({ ...valid, name: 'a'.repeat(101) })).toEqual({
			name: m.crew_error_name_max()
		})
	})

	it('limits the gamertag to 4 characters', () => {
		expect(validateCrewForm({ ...valid, gamertag: 'ABCD' })).toEqual({})
		expect(validateCrewForm({ ...valid, gamertag: 'ABCDE' })).toEqual({
			gamertag: m.crew_error_gamertag_max()
		})
	})

	it('limits the description to 500 characters', () => {
		expect(validateCrewForm({ ...valid, description: 'a'.repeat(500) })).toEqual({})
		expect(validateCrewForm({ ...valid, description: 'a'.repeat(501) })).toEqual({
			description: m.crew_error_description_max()
		})
	})

	it('reports every failing field at once', () => {
		expect(
			Object.keys(validateCrewForm({ name: '', gamertag: 'TOOLONG', description: 'a'.repeat(501) }))
		).toEqual(['name', 'gamertag', 'description'])
	})
})

describe('toCrewInput', () => {
	it('trims every field', () => {
		expect(
			toCrewInput({
				name: '  Siero Knights ',
				gamertag: ' SK ',
				granblueCrewId: ' 123 ',
				description: ' Hi '
			})
		).toEqual({ name: 'Siero Knights', gamertag: 'SK', granblueCrewId: '123', description: 'Hi' })
	})

	it('leaves blank optional fields undefined', () => {
		expect(
			toCrewInput({ name: 'Siero Knights', gamertag: ' ', granblueCrewId: '', description: '  ' })
		).toEqual({
			name: 'Siero Knights',
			gamertag: undefined,
			granblueCrewId: undefined,
			description: undefined
		})
	})
})
