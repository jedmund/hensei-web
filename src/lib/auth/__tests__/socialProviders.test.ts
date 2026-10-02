import { describe, it, expect } from 'vitest'
import { isSocialProvider, parseSocialProviders } from '../socialProviders'

describe('parseSocialProviders', () => {
	it('returns no providers when the flag is unset or empty', () => {
		expect(parseSocialProviders(undefined)).toEqual([])
		expect(parseSocialProviders(null)).toEqual([])
		expect(parseSocialProviders('')).toEqual([])
		expect(parseSocialProviders(' , ,')).toEqual([])
	})

	it('parses a comma-separated list in the given order', () => {
		expect(parseSocialProviders('discord,google')).toEqual(['discord', 'google'])
		expect(parseSocialProviders('apple,discord')).toEqual(['apple', 'discord'])
	})

	it('trims whitespace and ignores case', () => {
		expect(parseSocialProviders(' Discord , GOOGLE ,apple ')).toEqual([
			'discord',
			'google',
			'apple'
		])
	})

	it('drops unknown providers and duplicates', () => {
		expect(parseSocialProviders('discord,github,discord,twitter')).toEqual(['discord'])
	})
})

describe('isSocialProvider', () => {
	it('accepts only the supported providers', () => {
		expect(isSocialProvider('discord')).toBe(true)
		expect(isSocialProvider('google')).toBe(true)
		expect(isSocialProvider('apple')).toBe(true)
		expect(isSocialProvider('Discord')).toBe(false)
		expect(isSocialProvider('login')).toBe(false)
		expect(isSocialProvider(undefined)).toBe(false)
	})
})
