import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import SummonAuraList from './SummonAuraList.svelte'
import type { Summon, SummonAura } from '$lib/types/api/entities'

function aura(
	id: string,
	slot: string,
	uncapLevel: number,
	transcendenceStage: number,
	text: string
) {
	return {
		id,
		slot,
		target: 'normal_frame',
		uncapLevel,
		transcendenceStage,
		description: { en: text, ja: null },
		descriptionSegments: { en: [{ text }], ja: [] }
	} as SummonAura
}

const summon = {
	id: 'zephyrus',
	granblueId: '2040098000',
	name: { en: 'Zephyrus', ja: 'ゼピュロス' },
	rarity: 3,
	element: 1,
	uncap: { flb: true, ulb: true, transcendence: true },
	auraName: { en: "Zephyrus's Aura", ja: 'ゼピュロスの加護' },
	summonAuras: [
		aura('m0', 'main', 0, 0, 'Main base 80%'),
		aura('m5', 'main', 5, 0, 'Main ULB 150%'),
		aura('m5t3', 'main', 5, 3, 'Main stage 3 160%'),
		aura('s5t1', 'sub', 5, 1, 'Sub stage 1 10%')
	]
} as unknown as Summon

describe('SummonAuraList', () => {
	it("shows only the tier a team's copy has reached, with a toggle for the rest", () => {
		const { body } = render(SummonAuraList, {
			props: { summon, uncapLevel: 6, transcendenceStep: 2 }
		})
		expect(body).toContain('Main ULB 150%')
		expect(body).not.toContain('Main base 80%')
		expect(body).not.toContain('Main stage 3 160%')
		expect(body).toContain('Show all variants')
	})

	it('shows every tier without a team copy, and no toggle', () => {
		const { body } = render(SummonAuraList, { props: { summon } })
		expect(body).toContain('Main base 80%')
		expect(body).toContain('Main stage 3 160%')
		expect(body).not.toContain('Show all variants')
	})

	it('needs no toggle for a group with one tier', () => {
		const { body } = render(SummonAuraList, {
			props: { summon, uncapLevel: 6, transcendenceStep: 5 }
		})
		expect(body).toContain('Sub stage 1 10%')
		expect(body.match(/Show all variants/g)?.length).toBe(1)
	})

	it('shows the aura name above the groups, and nothing without one', () => {
		expect(render(SummonAuraList, { props: { summon } }).body).toContain("Zephyrus's Aura")
		const unnamed = { ...summon, auraName: null } as unknown as Summon
		expect(render(SummonAuraList, { props: { summon: unnamed } }).body).not.toContain('aura-name')
	})
})
