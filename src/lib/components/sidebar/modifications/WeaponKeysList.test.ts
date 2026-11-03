import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import WeaponKeysList from './WeaponKeysList.svelte'
import type { WeaponKey } from '$lib/types/api/entities'

const alpha: WeaponKey = {
	id: 'k1',
	granblueId: 0,
	name: { en: 'α Pendulum', ja: '' },
	slug: 'pendulum-alpha',
	series: [],
	slot: 0,
	group: 0,
	order: 0
}

describe('WeaponKeysList', () => {
	it("shows the key's skill at the copy's uncap and transcendence", () => {
		const version = (name: string, ordinal: number, transcendenceStage: number) => ({
			name: { en: name, ja: '' },
			description: { en: `${name} text`, ja: '' },
			ordinal,
			minUncap: transcendenceStage ? 5 : 3,
			transcendenceStage
		})
		const key = {
			...alpha,
			skillVersions: [
				version('α Revelation', 0, 0),
				version('α Revelation Ruber', 1, 1),
				version('α Revelation Ruber II', 2, 4)
			]
		}
		const at = (transcendenceStep: number) =>
			render(WeaponKeysList, { props: { weaponKeys: [key], uncapLevel: 5, transcendenceStep } })
				.body
		expect(at(0)).toContain('α Revelation text')
		expect(at(2)).toContain('α Revelation Ruber text')
		expect(at(2)).not.toContain('Ruber II')
		expect(at(5)).toContain('α Revelation Ruber II text')
		expect(at(0)).not.toContain('Skill 1')
		// The effect only: the skill's name would repeat the key's
		expect(at(0)).not.toContain('>α Revelation<')
	})

	it('is a button only when the key can be opened', () => {
		const plain = render(WeaponKeysList, { props: { weaponKeys: [alpha] } }).body
		expect(plain).not.toContain('<button')
		const selectable = render(WeaponKeysList, {
			props: { weaponKeys: [alpha], onSelect: () => {} }
		}).body
		expect(selectable).toContain('<button')
	})
})
