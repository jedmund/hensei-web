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

function badgesFor(skills: WeaponSkill[]): string[] {
	const { body } = render(WeaponSkillList, { props: { skills } })
	return [...body.matchAll(/<span class="badge flag[^"]*">([^<]*)<\/span>/g)].map(
		(match) => match[1] ?? ''
	)
}

describe('WeaponSkillList', () => {
	// Fediel's Spine: Eclipse's Stamina has a skill level, Black Covenant doesn't.
	it('marks only the skills that have a skill level', () => {
		const badges = badgesFor([
			{ position: 0, versions: [version("Eclipse's Stamina", true)] },
			{ position: 1, versions: [version('Black Covenant', false)] }
		])
		expect(badges).toEqual(['Skill Level'])
	})

	it('treats a skill without the flag as leveling', () => {
		expect(badgesFor([{ position: 0, versions: [version("Fire's Might")] }])).toEqual([
			'Skill Level'
		])
	})
})
