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

const bullet = (slug: string) => ({ slug, name: name(slug) }) as BulletLoadout['bullet']

/** Every weapon key in the game as [granblue ID, slot], from the weapon_keys table. */
const GAME_KEYS: [number, number][] = [
	[1, 0],
	[2, 0],
	[3, 0],
	[10001, 0],
	[10002, 0],
	[10003, 0],
	[10004, 0],
	[10005, 0],
	[10006, 0],
	[11001, 1],
	[11002, 1],
	[11003, 1],
	[11004, 1],
	[13001, 0],
	[13002, 0],
	[13003, 0],
	[13004, 0],
	[14001, 1],
	[14002, 1],
	[14003, 1],
	[14004, 1],
	[14005, 1],
	[14006, 1],
	[14007, 1],
	[14011, 1],
	[14012, 1],
	[14013, 1],
	[14014, 1],
	[14015, 1],
	[14016, 1],
	[14017, 1],
	[15001, 0],
	[15002, 0],
	[15003, 0],
	[15004, 0],
	[15005, 0],
	[15006, 0],
	[15007, 0],
	[15008, 0],
	[15009, 0],
	[16001, 1],
	[16002, 1],
	[17001, 2],
	[17002, 2],
	[17003, 2],
	[17004, 2],
	[19001, 0],
	[19002, 0],
	[19003, 0]
]

/**
 * The aliases gbf.wiki's Module:WeaponGrid accepts for each key parameter, by
 * position in the comma-separated list (https://gbf.wiki/Module:WeaponGrid).
 */
const WIKI_KEY_ALIASES = {
	opus: [
		['alpha', 'auto', 'beta', 'skill', 'gamma', 'ca', 'ougi', 'delta', 'cb'],
		[
			'strength',
			'stamina',
			'zeal',
			'enmity',
			'strife',
			'trium',
			'prosperity',
			'progression',
			'temperament',
			'celere',
			'restoration',
			'majesty',
			'glorification',
			'glory',
			'temptation',
			'freyr',
			'fruit',
			'forbiddance',
			'apple',
			'conduct',
			'depravity',
			'fallacy',
			'falsehood',
			'echo',
			'extremity',
			'ruination',
			'sagacity',
			'honing',
			'supremacy',
			'fathoms'
		]
	],
	ultima: [
		[
			'dominion',
			'will',
			'atk',
			'parity',
			'strife',
			'ma',
			'utopia',
			'vitality',
			'hp',
			'strength',
			'stamina',
			'ultio',
			'zeal',
			'enmity',
			'ars',
			'courage',
			'crit'
		],
		[
			'aggressio',
			'alpha',
			'auto',
			'facultas',
			'beta',
			'skill',
			'gamma',
			'ca',
			'ougi',
			'catena',
			'delta',
			'cb'
		],
		[
			'fortis',
			'ena',
			'cap',
			'sanatio',
			'dio',
			'healing',
			'impetus',
			'tria',
			'seraphic',
			'elatio',
			'tessera',
			'cbgain'
		]
	],
	draconic: [
		[
			'endurance',
			'def',
			'vermillion',
			'inferno',
			'fire',
			'azure',
			'abyss',
			'water',
			'golden',
			'crag',
			'earth',
			'emerald',
			'tempest',
			'wind',
			'white',
			'aureole',
			'light',
			'black',
			'malice',
			'dark',
			'fortitude',
			'salvation',
			'hp',
			'magnitude',
			'oblivion',
			'amp'
		],
		['optimus', 'primal', 'omega', 'magna']
	],
	destroyer: [
		[
			'auto',
			'oblivion',
			'godstrike',
			'skill',
			'ascendance',
			'godflair',
			'ougi',
			'ca',
			'maximality',
			'godheart'
		]
	],
	ccw: [['humanity', 'divinity', 'devilry']]
}

/** Bullets Template:Team/Bullets has an icon for (https://gbf.wiki/Template:Team/Bullets). */
const WIKI_BULLETS = [
	'iron-bullet-v',
	'full-metal-jacket-v',
	'expert-model-paradise-lost',
	'expert-model-chaos-legion',
	'expert-model-anagenesis',
	'expert-model-genesis-nova',
	'expert-model-rationale-exitium',
	'expert-model-anti-vasileia',
	'expert-model-apocalypse',
	'expert-model-hexachromatic',
	'slug-shot-ii',
	'chaser-shell',
	'enhancing-shell',
	'agni-point-iv',
	'neptune-point-iv',
	'titan-point-iv',
	'zephyrus-point-iv',
	'zeus-point-iv',
	'hades-point-iv'
]

/** The aliases Template:Team/Bullets accepts (matched case-sensitively). */
const WIKI_BULLET_ALIASES = [
	'iron',
	'fmj',
	'chaos',
	'chaos legion',
	'bubs',
	'bubz',
	'anagenesis',
	'apple',
	'belial',
	'subhl',
	'genesis nova',
	'baha',
	'slug',
	'echo',
	'chaser',
	'supp',
	'enhancing',
	'primal',
	'agni',
	'neptune',
	'titan',
	'zeph',
	'zephyrus',
	'zeus',
	'hades',
	'hexa',
	'hexarifle',
	'rationale exitium',
	'faa0',
	'faa0rifle',
	'faazero',
	'anti vasileia',
	'faa',
	'paradise lost',
	'pl',
	'faa0cartridge',
	'apocalypse',
	'hexaaether',
	'hexachromatic'
]

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

	it('writes weapon keys as positional aliases, one set per series', () => {
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(0, 'Renunciation', { weaponKeys: [key(14001, 1), key(13002, 0)] }),
					weapon(1, 'Ultima Sword', { weaponKeys: [key(10001, 0), key(11003, 1), key(17001, 2)] }),
					weapon(2, 'Ultima Staff', { weaponKeys: [key(10002, 0)] }),
					weapon(3, 'Draconic Harp', { weaponKeys: [key(16002, 1)] })
				]
			})
		)
		expect(line(text, 'opus')).toBe('|opus=skill,stamina')
		expect(line(text, 'ultima')).toBe('|ultima=will,ca,cap')
		expect(line(text, 'draconic')).toBe('|draconic=,omega')
		expect(line(text, 'ccw')).toBeUndefined()
	})

	it('takes the mainhand keys over other weapons of the same series', () => {
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(0, 'Ultima Staff', { weaponKeys: [key(10002, 0)] }),
					weapon(-1, 'Ultima Sword', { weaponKeys: [key(10004, 0), key(11002, 1)] })
				]
			})
		)
		expect(line(text, 'ultima')).toBe('|ultima=strength,skill')
	})

	it.each(GAME_KEYS)('exports key %i as an alias the wiki accepts', (granblueId, slot) => {
		const text = partyToWikiText(
			party({ weapons: [weapon(0, 'Keyed Weapon', { weaponKeys: [key(granblueId, slot)] })] })
		)
		const [, param, value = ''] = text.match(/^\|(opus|ultima|draconic|destroyer|ccw)=(.*)$/m)!
		const positions = WIKI_KEY_ALIASES[param as keyof typeof WIKI_KEY_ALIASES]
		// Destroyer and Class Champion take a single value that isn't split.
		const exported = positions.length > 1 ? value.split(',')[slot] : value
		expect(positions[slot]).toContain(exported)
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

	it('writes mainhand bullets as wiki aliases, leaving out ones it has no icon for', () => {
		const mainhand = weapon(-1, 'Hexachromatic Gun', {
			bullets: [
				{ position: 3, bullet: bullet('chaser-shell') },
				{ position: 0, bullet: bullet('expert-model-chaos-legion') },
				{ position: 1, bullet: bullet('iron-bullet-iv') },
				{ position: 2, bullet: bullet('rapid-bullet') }
			]
		})
		const text = partyToWikiText(
			party({ job: { name: name('Soldier') } as Party['job'], weapons: [mainhand] })
		)
		expect(line(text, 'class')).toBe('|class=Soldier|bullets=chaos legion,chaser')
	})

	it.each(WIKI_BULLETS)('exports the %s bullet as an alias the wiki accepts', (slug) => {
		const mainhand = weapon(-1, 'Gun', { bullets: [{ position: 0, bullet: bullet(slug) }] })
		const value = line(partyToWikiText(party({ weapons: [mainhand] })), 'class')!.split(
			'|bullets='
		)[1]
		expect(WIKI_BULLET_ALIASES).toContain(value)
	})

	it('omits bullets when the mainhand has none', () => {
		const text = partyToWikiText(party({ weapons: [weapon(-1, 'Ixaba', { bullets: [] })] }))
		expect(line(text, 'class')).toBe('|class=')
	})

	it('links back to the team on granblue.team as the source', () => {
		const url = 'https://granblue.team/teams/abc'
		expect(
			line(partyToWikiText(party({ name: 'Fire | {{Hexa}} [Full]' }), { url }), 'source')
		).toBe(
			'|source=[https://granblue.team/teams/abc Fire &#124; &#123;&#123;Hexa&#125;&#125; &#91;Full&#93; on granblue.team]'
		)
		expect(line(partyToWikiText(party(), { url }), 'source')).toBe(
			'|source=[https://granblue.team/teams/abc This team on granblue.team]'
		)
		expect(line(partyToWikiText(party()), 'source')).toBe('|source=')
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
