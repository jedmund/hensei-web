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
	it('labels a key with the skill it fills (an Opus Pendulum is Skill 2)', () => {
		const { body } = render(WeaponKeysList, {
			props: { weaponKeys: [alpha], weaponData: { series: { id: 's', slug: 'dark-opus' } } }
		})
		expect(body).toContain('Skill 2')
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
