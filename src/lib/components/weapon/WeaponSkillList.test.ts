import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import WeaponSkillList from './WeaponSkillList.svelte'
import type { WeaponKey, WeaponSkill, WeaponSkillVersion } from '$lib/types/api/entities'

function version(name: string, scalesWithSkillLevel?: boolean): WeaponSkillVersion {
	return {
		name: { en: name, ja: '' },
		description: { en: '', ja: '' },
		ordinal: 0,
		minUncap: 3,
		...(scalesWithSkillLevel === undefined ? {} : { scalesWithSkillLevel })
	}
}

// The meta line under each card (classification, skill level), one per skill.
function metaFor(skills: WeaponSkill[]): string[] {
	const { body } = render(WeaponSkillList, { props: { skills } })
	return [...body.matchAll(/<div class="meta[^"]*">([\s\S]*?)<\/div>/g)].map((match) =>
		(match[1] ?? '')
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<[^>]+>/g, '')
			.trim()
	)
}

describe('WeaponSkillList', () => {
	// Fediel's Spine: Eclipse's Stamina has a skill level, Black Covenant doesn't.
	it('marks only the skills that have a skill level', () => {
		const meta = metaFor([
			{ position: 0, versions: [version("Eclipse's Stamina", true)] },
			{ position: 1, versions: [version('Black Covenant', false)] }
		])
		expect(meta).toEqual(['Skill Level'])
	})

	it('treats a skill without the flag as leveling', () => {
		expect(metaFor([{ position: 0, versions: [version("Fire's Might")] }])).toEqual(['Skill Level'])
	})

	it("shows a slot's later versions as linked cards labelled with their tier", () => {
		const { body } = render(WeaponSkillList, {
			props: {
				skills: [
					{
						position: 0,
						versions: [
							version('Majesty'),
							{ ...version('Majesty II'), ordinal: 1, transcendenceStage: 2, unlockLevel: 220 }
						]
					}
				]
			}
		})
		expect(body.match(/class="skill-card[^"]*linked/g)).toHaveLength(1)
		expect(body).toContain('↳ T2 · Lv 220')
	})
})

// GBF-209: the skills a weapon's keys fill show the copy's key
describe('WeaponSkillList with keys', () => {
	const skill = (position: number, name: string, minUncap = 3): WeaponSkill => ({
		position,
		versions: [{ ...version(name), minUncap }]
	})
	const key = (slot: number, slug: string, name: string): WeaponKey => ({
		id: slug,
		granblueId: 0,
		name: { en: name, ja: '' },
		slug,
		series: [],
		slot,
		group: 0,
		order: 0
	})
	const series = (slug: string, numWeaponKeys: number, keySlotMinUncaps: number[]) =>
		({ id: slug, slug, name: { en: slug, ja: '' }, numWeaponKeys, keySlotMinUncaps }) as never

	// Each group's title and the text of its cards (their names and ↳ labels)
	function groups(props: Record<string, unknown>): string[][] {
		const { body } = render(WeaponSkillList, { props: props as never })
		return body
			.split('<section')
			.slice(1)
			.map((group) =>
				[
					...group.matchAll(
						/<(?:h3|span|div) class="(?:group-title|name|relation)(?: [^"]*)?"[^>]*>([\s\S]*?)<\//g
					)
				].map((m) => (m[1] ?? '').replace(/<!--[\s\S]*?-->/g, '').trim())
			)
	}

	const opus = [
		skill(0, 'Majesty'),
		skill(1, 'Guiding Revelation', 4),
		skill(2, 'Guiding Gospel', 5)
	]

	it("shows an Opus's keys under the gates they open", () => {
		const out = groups({
			skills: opus,
			series: series('dark-opus', 2, [4, 5]),
			weaponKeys: [key(0, 'pendulum-alpha', 'α Pendulum')],
			uncapLevel: 5
		})
		expect(out[0]).toEqual(['Skill 1', 'Majesty'])
		expect(out[1]).toEqual(['Skill 2', 'Guiding Revelation', '↳ Pendulum', 'α Pendulum'])
		expect(out[2]).toEqual(['Skill 3', 'Guiding Gospel', '↳ Pendulum/Chain', 'No Pendulum/Chain'])
	})

	it('leaves a slot the uncap has locked alone', () => {
		const out = groups({ skills: opus, series: series('dark-opus', 2, [4, 5]), uncapLevel: 4 })
		expect(out[2]).toEqual(['Skill 3', 'Guiding Gospel'])
	})

	it("puts an Ultima's first key under its own skill and an Anklet under Cycle of Strife", () => {
		const ultima = groups({
			skills: [
				skill(0, 'Gladius Rubell'),
				skill(1, 'Soulless Passage'),
				skill(2, 'Gate of Omnipotence', 5)
			],
			series: series('ultima', 3, [0, 0, 5]),
			weaponKeys: [key(0, 'gauph-strength', 'Gauph Key of Strength')],
			uncapLevel: 4
		})
		expect(ultima[0]).toEqual(['Skill 1', 'Gladius Rubell', '↳ Gauph Key', 'Gauph Key of Strength'])

		const destroyer = groups({
			skills: [skill(0, 'Godblade'), skill(1, 'Godshield'), skill(2, 'Cycle of Strife', 4)],
			series: series('destroyer', 1, [4]),
			weaponKeys: [key(0, 'anklet-oblivion', 'Anklet of Oblivion')],
			uncapLevel: 5
		})
		expect(destroyer[1]).toEqual(['Skill 2', 'Godshield'])
		expect(destroyer[2]).toEqual(['Skill 3', 'Cycle of Strife', '↳ Anklet', 'Anklet of Oblivion'])
	})

	it('shows no keys without a copy', () => {
		expect(groups({ skills: opus, series: series('dark-opus', 2, [4, 5]) })[1]).toEqual([
			'Skill 2',
			'Guiding Revelation'
		])
	})
})
