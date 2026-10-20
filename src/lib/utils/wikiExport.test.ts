import { describe, it, expect } from 'vitest'
import { partyToWikiText } from './wikiExport'
import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import type { WeaponKey, BulletLoadout } from '$lib/types/api/entities'

const name = (en: string) => ({ en, ja: en })

function character(
	position: number,
	en: string,
	extra: Partial<GridCharacter> = {}
): GridCharacter {
	return {
		id: `c${position}`,
		position,
		uncapLevel: 4,
		character: { id: en, granblueId: '3040000000', name: name(en), wiki: { en } },
		...extra
	} as GridCharacter
}

function weapon(
	position: number,
	en: string,
	extra: Partial<GridWeapon> = {},
	weaponExtra: Record<string, unknown> = {}
): GridWeapon {
	return {
		id: `w${position}`,
		position,
		mainhand: position === -1,
		uncapLevel: 4,
		weapon: {
			id: en,
			granblueId: '1040000000',
			name: name(en),
			wiki: { en },
			uncap: { flb: true, ulb: false, transcendence: false },
			...weaponExtra
		},
		...extra
	} as GridWeapon
}

function summon(position: number, en: string, extra: Partial<GridSummon> = {}): GridSummon {
	return {
		id: `s${position}`,
		position,
		main: position === -1,
		friend: position === 6,
		uncapLevel: 5,
		summon: {
			id: en,
			granblueId: '2040000000',
			name: name(en),
			wiki: { en },
			uncap: { flb: true, ulb: true, transcendence: false }
		},
		...extra
	} as GridSummon
}

function key(granblueId: number, slot: number): WeaponKey {
	return {
		id: `${granblueId}`,
		granblueId,
		name: name(''),
		slug: '',
		series: [],
		slot,
		group: 0,
		order: 0
	}
}

function party(overrides: Partial<Party> = {}): Party {
	return {
		id: 'p',
		shortcode: 'abc',
		characters: [],
		weapons: [],
		summons: [],
		...overrides
	} as Party
}

const line = (text: string, param: string) =>
	text.split('\n').find((l) => l.startsWith(`|${param}=`))

describe('partyToWikiText', () => {
	it('wraps an empty party in a TeamSpread template with every slot present', () => {
		const text = partyToWikiText(party())
		expect(text.startsWith('{{TeamSpread\n')).toBe(true)
		expect(text.endsWith('\n}}')).toBe(true)
		for (const param of [
			'class',
			'char5',
			'skill3',
			'mh',
			'wp9',
			'main',
			'support',
			's4',
			'sub2',
			'quick'
		]) {
			expect(line(text, param)).toBe(`|${param}=`)
		}
		expect(line(text, 'char6')).toBeUndefined()
		expect(line(text, 'wp10')).toBeUndefined()
	})

	it('writes the job, accessory and subskills', () => {
		const text = partyToWikiText(
			party({
				job: { name: name('Manadiver'), accessoryType: 2 } as Party['job'],
				accessory: { name: name('Morphe') } as Party['accessory'],
				jobSkills: {
					0: { name: name('Mana Burst') },
					1: { name: name('Miserable Mist') },
					3: { name: name('Clarity') }
				} as Party['jobSkills']
			})
		)
		expect(line(text, 'class')).toBe('|class=Manadiver|mino=Morphe')
		expect(line(text, 'skill1')).toBe('|skill1=Miserable Mist')
		expect(line(text, 'skill2')).toBe('|skill2=')
		expect(line(text, 'skill3')).toBe('|skill3=Clarity')
	})

	it('names items by their wiki page and writes uncaps below max', () => {
		const text = partyToWikiText(
			party({
				characters: [
					character(0, 'Narmaya (Summer)'),
					character(1, 'Seofon', { uncapLevel: 6, transcendenceStep: 3 }),
					character(2, 'Tikoh', {
						uncapLevel: 5,
						awakening: { type: { id: 'a', name: name('Attack'), slug: 'character-atk' } }
					})
				],
				weapons: [
					weapon(-1, 'Ixaba'),
					weapon(0, 'Gauntlet of Proudearth', { uncapLevel: 3 }),
					weapon(1, 'Celestial Harp', {
						awakening: { type: { id: 'a', name: name('C.A.'), slug: 'weapon-ca' } }
					})
				]
			})
		)
		expect(line(text, 'char1')).toBe('|char1=Narmaya (Summer)')
		expect(line(text, 'char2')).toBe('|char2=Seofon|uchar2=t3')
		expect(line(text, 'char3')).toBe('|char3=Tikoh|uchar3=5|awkchar3=attack')
		expect(line(text, 'mh')).toBe('|mh=Ixaba')
		expect(line(text, 'wp1')).toBe('|wp1=Gauntlet of Proudearth|u1=3')
		expect(line(text, 'wp2')).toBe('|wp2=Celestial Harp|awk2=ca')
	})

	it('falls back to the English name when there is no wiki page', () => {
		const gc = character(0, 'Unknown')
		gc.character.wiki = { en: '' }
		gc.character.name = name('Fallback Name')
		expect(line(partyToWikiText(party({ characters: [gc] })), 'char1')).toBe('|char1=Fallback Name')
	})

	it('drops the element suffix from Ultima weapons outside the mainhand', () => {
		const ultima = { series: { id: 'u', slug: 'ultima', name: name('Ultima') } }
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(-1, 'Ultima Sword (Fire)', {}, ultima),
					weapon(0, 'Ultima Staff (Fire)', {}, ultima)
				]
			})
		)
		expect(line(text, 'mh')).toBe('|mh=Ultima Sword (Fire)')
		expect(line(text, 'wp1')).toBe('|wp1=Ultima Staff')
	})

	it('writes weapon keys once per series in slot order', () => {
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(0, 'Renunciation', { weaponKeys: [key(14001, 1), key(13002, 0)] }),
					weapon(1, 'Ultima Sword', { weaponKeys: [key(10001, 0), key(11003, 1), key(17001, 2)] })
				]
			})
		)
		expect(line(text, 'opus')).toBe('|opus=Skill,Stamina')
		expect(line(text, 'ultima')).toBe('|ultima=Will,Charge Attack,Damage Cap')
		expect(line(text, 'draconic')).toBeUndefined()
	})

	it('maps summon slots, uncaps and the quick summon', () => {
		const text = partyToWikiText(
			party({
				summons: [
					summon(-1, 'Bahamut', { quickSummon: true }),
					summon(6, 'Lucifer', { uncapLevel: 6, transcendenceStep: 5 }),
					summon(0, 'Agni', { uncapLevel: 4 }),
					summon(4, 'Belial')
				]
			})
		)
		expect(line(text, 'main')).toBe('|main=Bahamut')
		expect(line(text, 'support')).toBe('|support=Lucifer')
		expect(line(text, 's1')).toBe('|s1=Agni|us1=4')
		expect(line(text, 'sub1')).toBe('|sub1=Belial')
		expect(line(text, 'quick')).toBe('|quick=main')
	})

	it('writes mainhand bullets by full name, keeping empty slots', () => {
		const bullet = (en: string) => ({ name: name(en) }) as BulletLoadout['bullet']
		const mainhand = weapon(-1, 'Hexachromatic Gun', {
			bullets: [
				{ position: 0, bullet: bullet('Iron Bullet V') },
				{ position: 2, bullet: bullet('Chaser Shell') }
			]
		})
		const text = partyToWikiText(
			party({ job: { name: name('Soldier') } as Party['job'], weapons: [mainhand] })
		)
		expect(line(text, 'class')).toBe('|class=Soldier|bullets=Iron Bullet V,,Chaser Shell')
	})

	it('omits bullets when the mainhand has none', () => {
		const text = partyToWikiText(party({ weapons: [weapon(-1, 'Ixaba', { bullets: [] })] }))
		expect(line(text, 'class')).toBe('|class=')
	})

	it('adds the extra character and weapon slots only when used', () => {
		const text = partyToWikiText(
			party({ characters: [character(6, 'Sandalphon')], weapons: [weapon(10, 'Extra Weapon')] })
		)
		expect(line(text, 'char7')).toBe('|char7=Sandalphon')
		expect(line(text, 'char8')).toBe('|char8=')
		expect(line(text, 'wp11')).toBe('|wp11=Extra Weapon')
		expect(line(text, 'wp12')).toBe('|wp12=')
	})
})
