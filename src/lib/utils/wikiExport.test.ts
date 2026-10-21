import { describe, it, expect } from 'vitest'
import { partyToWikiText } from './wikiExport'
import type {
	Party,
	GridCharacter,
	GridWeapon,
	GridSummon,
	Substitution
} from '$lib/types/api/party'
import type { WeaponKey, BulletLoadout } from '$lib/types/api/entities'
import type { AugmentSkill, Befoulment } from '$lib/types/api/weaponStatModifier'

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

function summon(
	position: number,
	en: string,
	extra: Partial<GridSummon> = {},
	summonExtra: Record<string, unknown> = {}
): GridSummon {
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
			uncap: { flb: true, ulb: true, transcendence: false },
			...summonExtra
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

/** Every AX modifier slug, from the weapon_stat_modifiers table. */
const AX_SLUGS = [
	'ax_atk',
	'ax_ca_cap',
	'ax_ca_dmg',
	'ax_ca_supp',
	'ax_da',
	'ax_debuff_res',
	'ax_def',
	'ax_ele_atk',
	'ax_ele_dmg_red',
	'ax_enmity',
	'ax_exp',
	'ax_healing',
	'ax_hp',
	'ax_multiattack',
	'ax_na_cap',
	'ax_rupie',
	'ax_skill_cap',
	'ax_skill_supp',
	'ax_stamina',
	'ax_ta'
]

/** Every befoulment modifier slug, from the weapon_stat_modifiers table. */
const BEFOULMENT_SLUGS = [
	'befoul_ability_dmg_down',
	'befoul_atk_down',
	'befoul_ca_dmg_down',
	'befoul_da_ta_down',
	'befoul_debuff_down',
	'befoul_def_down',
	'befoul_dot',
	'befoul_hp_down'
]

/** The `ax` values Template:Richitm has an icon for (https://gbf.wiki/Template:Richitm). */
const WIKI_AX = ['atk', 'def', 'hp', 'ca', 'ma', 'exp', 'rupie']

/** The `bf` values Template:Richitm and Template:Icon accept (`{{icon|bf …}}`). */
const WIKI_BEFOULMENTS = [
	'atk',
	'def',
	'ma',
	'ca',
	'skill',
	'hp',
	'turn dmg',
	'dot',
	'dsr',
	'debuff success'
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
					summon(
						6,
						'Lucifer',
						{ uncapLevel: 6, transcendenceStep: 5 },
						{ uncap: { flb: true, ulb: true, transcendence: true } }
					),
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

	it('exports uncap 6 without a transcendence step as 5★', () => {
		const transcends = { uncap: { flb: true, ulb: true, transcendence: true } }
		const text = partyToWikiText(
			party({
				characters: [
					character(0, 'Seofon', { uncapLevel: 6, transcendenceStep: 0 }),
					character(1, 'Tikoh', { uncapLevel: 6 })
				],
				weapons: [
					weapon(0, 'Ixaba', { uncapLevel: 6, transcendenceStep: 0 }, transcends),
					weapon(1, 'Celestial Harp', { uncapLevel: 6 }, transcends)
				],
				summons: [
					summon(0, 'Agni', { uncapLevel: 6, transcendenceStep: 0 }, transcends),
					summon(1, 'Zeus', { uncapLevel: 6 }, transcends)
				]
			})
		)
		expect(line(text, 'char1')).toBe('|char1=Seofon|uchar1=5')
		expect(line(text, 'char2')).toBe('|char2=Tikoh|uchar2=5')
		expect(line(text, 'wp1')).toBe('|wp1=Ixaba|u1=5')
		expect(line(text, 'wp2')).toBe('|wp2=Celestial Harp|u2=5')
		expect(line(text, 's1')).toBe('|s1=Agni|us1=5')
		expect(line(text, 's2')).toBe('|s2=Zeus|us2=5')
	})

	it('writes transcendence stages and omits t5 on summons', () => {
		const transcends = { uncap: { flb: true, ulb: true, transcendence: true } }
		const text = partyToWikiText(
			party({
				weapons: [weapon(0, 'Ixaba', { uncapLevel: 6, transcendenceStep: 5 }, transcends)],
				summons: [
					summon(-1, 'Bahamut', { uncapLevel: 6, transcendenceStep: 3 }, transcends),
					summon(6, 'Lucifer', { uncapLevel: 6, transcendenceStep: 5 }, transcends),
					summon(4, 'Agni', { uncapLevel: 5 }, transcends)
				]
			})
		)
		expect(line(text, 'wp1')).toBe('|wp1=Ixaba|u1=t5')
		expect(line(text, 'main')).toBe('|main=Bahamut|umain=t3')
		expect(line(text, 'support')).toBe('|support=Lucifer')
		expect(line(text, 'sub1')).toBe('|sub1=Agni|usub1=5')
	})

	it('trusts the transcendence step over a stale uncap level', () => {
		const transcends = { uncap: { flb: true, ulb: true, transcendence: true } }
		const text = partyToWikiText(
			party({
				summons: [
					summon(0, 'Hades', { uncapLevel: 5, transcendenceStep: 5 }, transcends),
					summon(1, 'Titan', { uncapLevel: 5, transcendenceStep: 2 }, transcends)
				]
			})
		)
		expect(line(text, 's1')).toBe('|s1=Hades')
		expect(line(text, 's2')).toBe('|s2=Titan|us2=t2')
	})

	it('omits Dark Opus uncaps at 5★ but writes their transcendence', () => {
		const opus = {
			series: { slug: 'dark-opus' },
			uncap: { flb: true, ulb: true, transcendence: true }
		}
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(0, 'Renunciation', { uncapLevel: 5 }, opus),
					weapon(1, 'Repudiation', { uncapLevel: 6, transcendenceStep: 0 }, opus),
					weapon(2, 'Renunciation', { uncapLevel: 6, transcendenceStep: 2 }, opus),
					weapon(3, 'Repudiation', { uncapLevel: 4 }, opus)
				]
			})
		)
		expect(line(text, 'wp1')).toBe('|wp1=Renunciation')
		expect(line(text, 'wp2')).toBe('|wp2=Repudiation')
		expect(line(text, 'wp3')).toBe('|wp3=Renunciation|u3=t2')
		expect(line(text, 'wp4')).toBe('|wp4=Repudiation|u4=4')
	})

	it('writes uncaps for weapons in the extra slots', () => {
		const text = partyToWikiText(
			party({ weapons: [weapon(9, 'Extra Weapon', { uncapLevel: 3 }), weapon(11, 'Max Weapon')] })
		)
		expect(line(text, 'wp10')).toBe('|wp10=Extra Weapon|u10=3')
		expect(line(text, 'wp12')).toBe('|wp12=Max Weapon')
	})

	it('names element-changed weapons by their element page', () => {
		const series = (slug: string) => ({ series: { slug, elementChangeable: true } })
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(-1, 'Ultima Sword', { element: 5 }, series('ultima')),
					weapon(0, 'Excalibur', { element: 2 }, series('superlative')),
					weapon(1, 'Unsigned Kaneshige', { element: 4 }, series('class-champion')),
					weapon(2, 'Murakumo', { element: 6 }, series('class-champion')),
					weapon(3, 'Seven-Star Sword (Awakened)', { element: 1 }, series('revenant')),
					weapon(4, 'Ultima Staff', { element: 0 }, series('ultima')),
					weapon(5, 'Ultima Claw', {}, series('ultima')),
					weapon(6, 'Ixaba', { element: 2 }, { series: { slug: 'xeno' } })
				]
			})
		)
		expect(line(text, 'mh')).toBe('|mh=Ultima Sword (Dark)')
		expect(line(text, 'wp1')).toBe('|wp1=Excalibur (Fire)')
		expect(line(text, 'wp2')).toBe('|wp2=Unsigned Kaneshige (Earth)')
		expect(line(text, 'wp3')).toBe('|wp3=Murakumo')
		expect(line(text, 'wp4')).toBe('|wp4=Seven-Star Sword (Awakened)')
		expect(line(text, 'wp5')).toBe('|wp5=Ultima Staff')
		expect(line(text, 'wp6')).toBe('|wp6=Ultima Claw')
		expect(line(text, 'wp7')).toBe('|wp7=Ixaba')
	})

	it('marks characters with a perpetuity ring', () => {
		const text = partyToWikiText(
			party({
				characters: [character(0, 'Caim', { perpetuity: true }), character(1, 'Eahta')]
			})
		)
		expect(line(text, 'char1')).toBe('|char1=Caim|ringchar1=true')
		expect(line(text, 'char2')).toBe('|char2=Eahta')
	})

	it('writes the abilities turned off in Full Auto', () => {
		const text = partyToWikiText(
			party({
				job: { name: name('Manadiver') } as Party['job'],
				jobSkills: {
					0: { name: name('Mana Burst') },
					1: { name: name('Miserable Mist') },
					2: { name: name('Clarity') }
				} as Party['jobSkills'],
				fullAutoSkills: { '0': false, '1': true, '2': false, '3': false },
				characters: [
					character(0, 'Makura (Valentine)', { fullAutoSkills: { '2': false, '0': false } }),
					character(1, 'Uriel', { fullAutoSkills: { '0': true } })
				]
			})
		)
		// Slot 3 has no subskill, so it isn't listed.
		expect(line(text, 'class')).toBe('|class=Manadiver|skilloffmc=13')
		expect(line(text, 'char1')).toBe('|char1=Makura (Valentine)|skilloff1=13')
		expect(line(text, 'char2')).toBe('|char2=Uriel')
	})

	it('writes the first AX skill and the befoulment', () => {
		const modifier = (slug: string) => ({ modifier: { slug } }) as AugmentSkill
		const text = partyToWikiText(
			party({
				weapons: [
					weapon(-1, 'Staff of Renunciation', {
						befoulment: { ...modifier('befoul_ca_dmg_down'), exorcismLevel: 1 }
					}),
					weapon(0, 'Pillardriver', { ax: [modifier('ax_atk'), modifier('ax_da')] }),
					weapon(1, 'Wrathfire Longblade', { ax: [modifier('ax_stamina')] }),
					weapon(2, 'Vortex of the Void', {
						befoulment: { ...modifier('befoul_dot'), exorcismLevel: 1 }
					})
				]
			})
		)
		expect(line(text, 'mh')).toBe('|mh=Staff of Renunciation|bfmh=ca')
		expect(line(text, 'wp1')).toBe('|wp1=Pillardriver|ax1=atk')
		expect(line(text, 'wp2')).toBe('|wp2=Wrathfire Longblade')
		expect(line(text, 'wp3')).toBe('|wp3=Vortex of the Void|bf3=turn dmg')
	})

	it.each(AX_SLUGS)('exports AX skill %s as a Richitm value or not at all', (slug) => {
		const ax = [{ modifier: { slug } } as AugmentSkill]
		const value = line(partyToWikiText(party({ weapons: [weapon(0, 'AX', { ax })] })), 'wp1')!
		const exported = value.split('|ax1=')[1]
		expect([undefined, ...WIKI_AX]).toContain(exported)
	})

	it.each(BEFOULMENT_SLUGS)('exports befoulment %s as a Richitm value', (slug) => {
		const befoulment = { modifier: { slug }, strength: 1, exorcismLevel: 1 } as Befoulment
		const value = line(
			partyToWikiText(party({ weapons: [weapon(0, 'Bf', { befoulment })] })),
			'wp1'
		)
		expect(WIKI_BEFOULMENTS).toContain(value!.split('|bf1=')[1])
	})

	it('writes substitutes as item links in the swap bubble', () => {
		const sub = (position: number, item: Partial<Substitution>) =>
			({ id: `sub${position}`, position, ...item }) as Substitution
		const text = partyToWikiText(
			party({
				characters: [
					character(0, 'Uriel', {
						substitutions: [
							sub(1, { gridCharacter: character(0, 'Vira (Grand)') }),
							sub(0, { gridCharacter: character(0, 'Alexiel (Summer)') })
						]
					})
				],
				weapons: [
					weapon(-1, 'Unsigned Kaneshige', {
						substitutions: [
							sub(0, {
								gridWeapon: weapon(
									-1,
									'Ultima Blade',
									{ element: 4 },
									{ series: { slug: 'ultima' } }
								)
							})
						]
					}),
					weapon(3, 'Vortex of the Void', {
						substitutions: [
							sub(0, { gridWeapon: weapon(3, 'Collapse of The Tower') }),
							sub(1, { gridWeapon: weapon(3, 'Axe of Eternal Splendor') })
						]
					})
				],
				summons: [
					summon(-1, 'Zeus', { substitutions: [sub(0, { gridSummon: summon(-1, 'Versusia') })] }),
					summon(6, 'Yggdrasil Omega', {
						substitutions: [sub(0, { gridSummon: summon(6, 'Varuna') })]
					}),
					summon(0, 'Mammoth', { substitutions: [sub(0, { gridSummon: summon(0, 'Kaguya') })] }),
					summon(5, 'Wedges of the Sky', {
						substitutions: [sub(0, { gridSummon: summon(5, 'Morrigna (Summon)') })]
					})
				]
			})
		)
		expect(line(text, 'char1')).toBe(
			'|char1=Uriel|swapchar1={{itm|Alexiel (Summer)}}<br/>{{itm|Vira (Grand)}}'
		)
		expect(line(text, 'mh')).toBe('|mh=Unsigned Kaneshige|swapmh={{itm|Ultima Blade (Earth)}}')
		expect(line(text, 'wp4')).toBe(
			'|wp4=Vortex of the Void|swap4={{itm|Collapse of The Tower}}<br/>{{itm|Axe of Eternal Splendor}}'
		)
		expect(line(text, 'main')).toBe('|main=Zeus|swapmain={{itm|Versusia}}')
		expect(line(text, 'support')).toBe('|support=Yggdrasil Omega|swapsupport={{itm|Varuna}}')
		expect(line(text, 's1')).toBe('|s1=Mammoth|swaps1={{itm|Kaguya}}')
		expect(line(text, 'sub2')).toBe('|sub2=Wedges of the Sky|swapsub2={{itm|Morrigna (Summon)}}')
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
