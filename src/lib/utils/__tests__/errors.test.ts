import { describe, it, expect } from 'vitest'
import { extractErrorMessage } from '../errors'

describe('extractErrorMessage', () => {
	it('returns fallback for null error', () => {
		expect(extractErrorMessage(null, 'Something went wrong')).toBe('Something went wrong')
	})

	it('returns fallback for undefined error', () => {
		expect(extractErrorMessage(undefined)).toBe('An error occurred')
	})

	it('extracts simple message from nested details.errors.message', () => {
		const error = {
			details: {
				details: {
					errors: {
						message: 'Party could not be found'
					}
				}
			}
		}
		expect(extractErrorMessage(error, 'fallback')).toBe('Party could not be found')
	})

	it('extracts field-based errors with humanized field names', () => {
		const error = {
			details: {
				errors: {
					awakening_level: ['must be between 1 and 20']
				}
			}
		}
		expect(extractErrorMessage(error, 'fallback')).toBe('Awakening Level must be between 1 and 20')
	})

	it('joins multiple field errors with semicolons', () => {
		const error = {
			details: {
				errors: {
					uncap_level: ['must be between 0 and 6'],
					transcendence_step: ['must be between 0 and 10']
				}
			}
		}
		const result = extractErrorMessage(error, 'fallback')
		expect(result).toContain('Uncap Level must be between 0 and 6')
		expect(result).toContain('Transcendence Step must be between 0 and 10')
		expect(result).toContain('; ')
	})

	it('joins multiple messages for a single field', () => {
		const error = {
			details: {
				errors: {
					weapon_keys: ['must be compatible with weapon', 'cannot have duplicate keys']
				}
			}
		}
		expect(extractErrorMessage(error, 'fallback')).toBe(
			'Weapon Keys must be compatible with weapon, cannot have duplicate keys'
		)
	})

	it('falls back to error.message when no nested structure', () => {
		const error = { message: 'Network error' }
		expect(extractErrorMessage(error, 'fallback')).toBe('Network error')
	})

	it('navigates through multiple levels of nested details', () => {
		const error = {
			details: {
				details: {
					details: {
						errors: {
							message: 'Deeply nested message'
						}
					}
				}
			}
		}
		expect(extractErrorMessage(error, 'fallback')).toBe('Deeply nested message')
	})
})
