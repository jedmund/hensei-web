import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import WeaponSkillList from './WeaponSkillList.svelte'
import type { WeaponSkill, WeaponSkillVersion } from '$lib/types/api/entities'

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
