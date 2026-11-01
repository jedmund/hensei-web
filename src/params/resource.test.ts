import { describe, expect, it } from 'vitest'
import { RESOURCES } from '$lib/features/database/schema/registry'
import { match } from './resource'

describe('resource param matcher', () => {
	it('matches registered resources', () => {
		expect(match('weapons')).toBe(true)
		expect(match('characters')).toBe(true)
	})

	it('matches each definition under its own name', () => {
		for (const [name, def] of Object.entries(RESOURCES)) {
			expect(def.name).toBe(name)
			expect(match(name)).toBe(true)
		}
	})

	it('leaves everything else to the bespoke routes', () => {
		for (const param of [
			'summons',
			'weapon-skills',
			'events',
			'import',
			'Weapons',
			'toString',
			''
		]) {
			expect(match(param), param).toBe(false)
		}
	})
})
