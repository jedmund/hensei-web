import { describe, it, expect } from 'vitest'
import { shortcodeFromInput } from '../shortcode'

describe('shortcodeFromInput', () => {
	it('accepts a shortcode or a team URL', () => {
		expect(shortcodeFromInput('  aB3xY ')).toBe('aB3xY')
		expect(shortcodeFromInput('https://granblue.team/teams/aB3xY/characters')).toBe('aB3xY')
	})

	it('rejects anything else', () => {
		expect(shortcodeFromInput('')).toBeNull()
		expect(shortcodeFromInput('<script>')).toBeNull()
	})
})
