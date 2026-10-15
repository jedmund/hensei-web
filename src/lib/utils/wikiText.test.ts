import { describe, it, expect } from 'vitest'
import { wikiToHtml } from './wikiText'

describe('wikiToHtml', () => {
	it('returns empty string for nullish input', () => {
		expect(wikiToHtml(null)).toBe('')
		expect(wikiToHtml(undefined)).toBe('')
		expect(wikiToHtml('')).toBe('')
	})

	it('converts bold markup to <strong> and hides the apostrophes', () => {
		expect(wikiToHtml("'''When main weapon (MC only):'''")).toBe(
			'<strong>When main weapon (MC only):</strong>'
		)
		expect(wikiToHtml("'''When main weapon (MC only):'''")).not.toContain("'''")
	})

	it('converts italic markup to <em>', () => {
		expect(wikiToHtml("''subtle''")).toBe('<em>subtle</em>')
	})

	it('renders <br> variants as line breaks', () => {
		expect(wikiToHtml('a<br />b<br/>c<br>d')).toBe('a<br>b<br>c<br>d')
	})

	it('reduces {{status|Name|...}} to the status name', () => {
		expect(wikiToHtml('gain {{status|DMG Mitigation|t=2T|a=3000}}.')).toBe('gain DMG Mitigation.')
	})

	it('reduces wiki links to their display text', () => {
		expect(wikiToHtml('[[Multistrike|Double Strike]] effect')).toBe('Double Strike effect')
		expect(wikiToHtml('[[Bonus DMG]]')).toBe('Bonus DMG')
	})

	it('strips <ref> citations', () => {
		expect(wikiToHtml('Reduce damage.<ref name="GameWith, Hrunting">cite</ref>')).toBe(
			'Reduce damage.'
		)
		expect(wikiToHtml('Reduce damage.<ref name=GameWith />')).toBe('Reduce damage.')
	})

	it('escapes stray HTML to prevent injection', () => {
		expect(wikiToHtml('<img src=x onerror=alert(1)>')).not.toContain('<img')
		expect(wikiToHtml('a & b')).toContain('&amp;')
	})

	it('handles a full Hrunting-style description', () => {
		const input =
			"'''When main weapon (MC only):'''<br />All Earth allies gain {{status|Veil|t=i}}.<ref name=GW />"
		expect(wikiToHtml(input)).toBe(
			'<strong>When main weapon (MC only):</strong><br>All Earth allies gain Veil.'
		)
	})

	it("shows a template's text rather than its name", () => {
		expect(wikiToHtml('Take {{tt|5% damage|Based on max HP.}} every turn')).toBe(
			'Take 5% damage every turn'
		)
		expect(wikiToHtml('{{ClassSkill|Limit Burst}} and {{classSkill|skill=Aether Blast III}}')).toBe(
			'Limit Burst and Aether Blast III'
		)
		expect(wikiToHtml('{{tt|[[Weapon_Skills|Medium boost]]|Normal}} to ATK')).toBe(
			'Medium boost to ATK'
		)
	})

	it('resolves nested templates and template parameters', () => {
		expect(wikiToHtml('{{{s2_desc|{{ClassSkill|Reprise}} gains {{status|DEF Down|t=1T}}.}}}')).toBe(
			'Reprise gains DEF Down.'
		)
		expect(wikiToHtml("Big boost to {{WeaponElement|{{{element|}}}}} allies' ATK")).toBe(
			'Big boost to same-element allies&#39; ATK'
		)
		expect(wikiToHtml('{{WeaponElement|fire}} allies')).toBe('Fire allies')
	})
})
