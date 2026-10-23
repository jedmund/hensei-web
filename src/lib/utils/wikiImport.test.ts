import { describe, it, expect } from 'vitest'
import {
	parseTeamSpread,
	isEmptyWikiImport,
	WikiImportParseError,
	MAX_WIKI_IMPORT_BYTES
} from './wikiImport'
import { partyToWikiText } from './wikiExport'
import {
	BULLET_ALIASES,
	KEY_ALIASES,
	KEY_PARAMS,
	MINO_ALIASES,
	SHIELD_ALIASES
} from './wikiAliases'
import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import type { WeaponKey, BulletLoadout } from '$lib/types/api/entities'
import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'
import type { WikiImportRequest } from '$lib/types/api/wikiImport'

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

const bullet = (slug: string) => ({ slug, name: name(slug) }) as BulletLoadout['bullet']
const awakening = (slug: string) => ({ type: { id: slug, name: name(slug), slug } })
const transcends = { uncap: { flb: true, ulb: true, transcendence: true } }

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

function request(overrides: Partial<WikiImportRequest> = {}): WikiImportRequest {
	return {
		job: { name: null, accessory: null, skills: [null, null, null], fullAutoOff: [] },
		bullets: [],
		characters: [],
		weapons: [],
		keys: {},
		summons: [],
		quick: null,
		...overrides
	}
}

const wrap = (body: string) => `{{TeamSpread\n${body}\n}}`

describe('parseTeamSpread round trip', () => {
	it('reads back an exported team, minus what the wiki format drops', () => {
		const ax = [{ modifier: { slug: 'ax_atk' } } as AugmentSkill]
		const exported = party({
			job: { name: name('Manadiver'), accessoryType: 2 } as Party['job'],
			accessory: { name: name('Ouroboros Mino') } as Party['accessory'],
			jobSkills: {
				0: { name: name('Mana Burst') },
				1: { name: name('Miserable Mist') },
				3: { name: name('Clarity') }
			} as Party['jobSkills'],
			// Slot 2 has no subskill, so its toggle isn't exported.
			fullAutoSkills: { '0': false, '1': true, '2': false },
			characters: [
				character(0, 'Seofon', {
					uncapLevel: 6,
					transcendenceStep: 3,
					awakening: awakening('character-atk'),
					perpetuity: true,
					fullAutoSkills: { '0': false, '2': false }
				}),
				// Below 5★ the export leaves the uncap out
				character(1, 'Tikoh'),
				character(2, 'Narmaya (Summer)', {
					uncapLevel: 5,
					substitutions: [{ id: 'sub', position: 0, gridCharacter: character(2, 'Vira (Grand)') }]
				})
			],
			weapons: [
				weapon(
					-1,
					'Ultima Sword',
					{
						element: 5,
						awakening: awakening('weapon-multi'),
						weaponKeys: [key(10001, 0), key(11003, 1), key(17001, 2)],
						bullets: [
							{ position: 2, bullet: bullet('chaser-shell') },
							{ position: 0, bullet: bullet('expert-model-chaos-legion') },
							// No icon on the wiki at this tier
							{ position: 1, bullet: bullet('iron-bullet-iv') }
						],
						ax
					},
					{ series: { slug: 'ultima' } }
				),
				weapon(
					0,
					'Renunciation',
					{
						uncapLevel: 5,
						weaponKeys: [key(13002, 0), key(14001, 1)],
						befoulment: {
							modifier: { slug: 'befoul_atk_down' },
							strength: 1,
							exorcismLevel: 1
						} as GridWeapon['befoulment']
					},
					{ series: { slug: 'dark-opus' }, ...transcends }
				),
				weapon(1, 'Gauntlet of Proudearth', {
					uncapLevel: 3,
					awakening: awakening('weapon-ca'),
					ax
				}),
				weapon(9, 'Sword of Bahamut Coda', { uncapLevel: 3 })
			],
			summons: [
				summon(-1, 'Bahamut', { quickSummon: true }),
				summon(6, 'Lucifer', { uncapLevel: 6, transcendenceStep: 5 }, transcends),
				summon(0, 'Agni', { uncapLevel: 4 }),
				summon(4, 'Belial')
			]
		})

		const { request: parsed, unsupported } = parseTeamSpread(
			partyToWikiText(exported, { url: 'https://granblue.team/teams/abc' })
		)

		expect(unsupported).toEqual([])
		expect(parsed).toEqual(
			request({
				job: {
					name: 'Manadiver',
					accessory: 'Ouroboros Mino',
					skills: ['Miserable Mist', null, 'Clarity'],
					fullAutoOff: [0]
				},
				bullets: ['expert-model-chaos-legion', 'chaser-shell'],
				characters: [
					{
						position: 0,
						title: 'Seofon',
						uncap: 't3',
						awakening: 'attack',
						ring: true,
						fullAutoOff: [0, 2]
					},
					{
						position: 1,
						title: 'Tikoh',
						uncap: null,
						awakening: null,
						ring: false,
						fullAutoOff: []
					},
					{
						position: 2,
						title: 'Narmaya (Summer)',
						uncap: '5',
						awakening: null,
						ring: false,
						fullAutoOff: []
					}
				],
				weapons: [
					{ position: -1, title: 'Ultima Sword (Dark)', uncap: null, awakening: 'multiattack' },
					// Dark Opus at 5★ is left out of the export, so it comes back as max
					{ position: 0, title: 'Renunciation', uncap: null, awakening: null },
					{ position: 1, title: 'Gauntlet of Proudearth', uncap: '3', awakening: 'ca' },
					{ position: 9, title: 'Sword of Bahamut Coda', uncap: '3', awakening: null }
				],
				keys: { opus: [13002, 14001], ultima: [10001, 11003, 17001] },
				summons: [
					{ position: -1, title: 'Bahamut', uncap: null },
					{ position: 6, title: 'Lucifer', uncap: null },
					{ position: 0, title: 'Agni', uncap: '4' },
					{ position: 4, title: 'Belial', uncap: null }
				],
				quick: -1
			})
		)
	})

	it('reads back an unlimited shield team with single-slot keys', () => {
		const exported = party({
			job: { name: name('Shieldsworn'), accessoryType: 1 } as Party['job'],
			accessory: { name: name("Hero's Shield") } as Party['accessory'],
			characters: [character(0, 'Fediel', { uncapLevel: 5 }), character(6, 'Sandalphon')],
			weapons: [
				weapon(-1, 'Ixaba', { uncapLevel: 6, transcendenceStep: 0 }, transcends),
				weapon(0, 'Draconic Harp', { weaponKeys: [key(16002, 1)] }),
				weapon(1, 'Destroyer Blade', { weaponKeys: [key(19003, 0)] }),
				weapon(2, 'Faust', { weaponKeys: [key(2, 0)] })
			],
			summons: [
				summon(-1, 'Titan', { uncapLevel: 6, transcendenceStep: 2 }, transcends),
				summon(1, 'Zeus', { quickSummon: true })
			]
		})

		const { request: parsed } = parseTeamSpread(partyToWikiText(exported))

		expect(parsed).toEqual(
			request({
				job: {
					name: 'Shieldsworn',
					accessory: "Hero's Shield",
					skills: [null, null, null],
					fullAutoOff: []
				},
				characters: [
					{
						position: 0,
						title: 'Fediel',
						uncap: '5',
						awakening: null,
						ring: false,
						fullAutoOff: []
					},
					{
						position: 6,
						title: 'Sandalphon',
						uncap: null,
						awakening: null,
						ring: false,
						fullAutoOff: []
					}
				],
				weapons: [
					// Uncap 6 without a step is 5★
					{ position: -1, title: 'Ixaba', uncap: '5', awakening: null },
					{ position: 0, title: 'Draconic Harp', uncap: null, awakening: null },
					{ position: 1, title: 'Destroyer Blade', uncap: null, awakening: null },
					{ position: 2, title: 'Faust', uncap: null, awakening: null }
				],
				keys: { draconic: [null, 16002], destroyer: [19003], ccw: [2] },
				summons: [
					{ position: -1, title: 'Titan', uncap: 't2' },
					{ position: 1, title: 'Zeus', uncap: null }
				],
				quick: 1
			})
		)
	})

	it('reads back an empty team as nothing to import', () => {
		const { request: parsed, unsupported } = parseTeamSpread(partyToWikiText(party()))
		expect(parsed).toEqual(request())
		expect(unsupported).toEqual([])
		expect(isEmptyWikiImport(parsed)).toBe(true)
	})
})

describe('parseTeamSpread aliases', () => {
	const keysOf = (param: string, value: string) =>
		parseTeamSpread(wrap(`|${param}=${value}`)).request.keys

	it.each(
		KEY_PARAMS.flatMap((param) =>
			KEY_ALIASES[param].flatMap((slot, index) =>
				slot.flatMap(({ granblueId, aliases }) =>
					aliases.map((alias) => [param, index, alias, granblueId] as const)
				)
			)
		)
	)('reads the %s key in slot %i, %s, as %i', (param, slot, alias, granblueId) => {
		const value = [...Array(slot).fill(''), alias.toUpperCase()].join(',')
		const ids = keysOf(param, value)[param]!
		expect(ids[slot]).toBe(granblueId)
		expect(ids.slice(0, slot).every((id) => id === null)).toBe(true)
	})

	it('reads the wiki example keys', () => {
		expect(
			parseTeamSpread(
				wrap(
					'|ccw=humanity\n|opus=skill,echo\n|ultima=strength,auto,seraphic\n|draconic=water,magna\n|destroyer=auto'
				)
			).request.keys
		).toEqual({
			opus: [13002, 14017],
			ultima: [10004, 11001, 17003],
			draconic: [15003, 16002],
			destroyer: [19001],
			ccw: [1]
		})
	})

	it('notes key aliases it does not know and keeps the rest', () => {
		const { request: parsed, unsupported } = parseTeamSpread(wrap('|opus=nope,stamina'))
		expect(parsed.keys).toEqual({ opus: [null, 14001] })
		expect(unsupported).toEqual([{ code: 'unknown_key', param: 'opus', value: 'nope' }])
	})

	it.each(
		Object.entries(BULLET_ALIASES).flatMap(([slug, aliases]) =>
			aliases.map((alias) => [alias, slug] as const)
		)
	)('reads the %s bullet as %s', (alias, slug) => {
		expect(parseTeamSpread(wrap(`|bullets=${alias}`)).request.bullets).toEqual([slug])
	})

	it('reads bullets in order, in any case, and skips primal with a note', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			wrap('|class=Soldier|bullets= bubz, Bubs ,primal,subhl,,mystery ')
		)
		expect(parsed.bullets).toEqual([
			'expert-model-chaos-legion',
			'expert-model-chaos-legion',
			'expert-model-genesis-nova'
		])
		expect(unsupported).toEqual([
			{ code: 'primal_bullet', param: 'bullets', value: 'primal' },
			{ code: 'unknown_bullet', param: 'bullets', value: 'mystery' }
		])
	})

	it.each(Object.entries(MINO_ALIASES))('reads mino=%s as %s', (alias, full) => {
		expect(parseTeamSpread(wrap(`|mino=${alias.toUpperCase()}`)).request.job.accessory).toBe(full)
	})

	it.each(Object.entries(SHIELD_ALIASES))('reads shield=%s as %s', (alias, full) => {
		expect(parseTeamSpread(wrap(`|shield=${alias}`)).request.job.accessory).toBe(full)
	})

	it('sends a manatura or shield name it has no alias for as written', () => {
		expect(parseTeamSpread(wrap('|mino=Morphe')).request.job.accessory).toBe('Morphe')
		expect(parseTeamSpread(wrap('|shield=Some New Shield')).request.job.accessory).toBe(
			'Some New Shield'
		)
	})

	it.each([
		['atk', 'attack'],
		['Attack', 'attack'],
		['def', 'defense'],
		['defense', 'defense'],
		['ma', 'multiattack'],
		['multi', 'multiattack'],
		['MultiAttack', 'multiattack']
	])('reads awkchar=%s as %s', (alias, value) => {
		const [char] = parseTeamSpread(wrap(`|char1=Anne|awkchar1=${alias}`)).request.characters
		expect(char!.awakening).toBe(value)
	})

	it.each([
		['atk', 'attack'],
		['Attack', 'attack'],
		['def', 'defense'],
		['spec', 'special'],
		['special', 'special'],
		['ca', 'ca'],
		['C.A.', 'ca'],
		['skill', 'skill'],
		['skill dmg', 'skill'],
		['heal', 'heal'],
		['healing', 'heal'],
		['ma', 'multiattack'],
		['multi', 'multiattack'],
		['multiattack', 'multiattack']
	])('reads awk=%s as %s', (alias, value) => {
		const [weapon] = parseTeamSpread(wrap(`|mh=Ixaba|awkmh=${alias}`)).request.weapons
		expect(weapon!.awakening).toBe(value)
	})

	it('notes awakenings it does not know, and weapon-only ones on characters', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			wrap('|char1=Anne|awkchar1=heal|wp1=Ixaba|awk1=sparkle')
		)
		expect(parsed.characters[0]!.awakening).toBeNull()
		expect(parsed.weapons[0]!.awakening).toBeNull()
		expect(unsupported).toEqual([
			{ code: 'unknown_awakening', param: 'awkchar1', value: 'heal' },
			{ code: 'unknown_awakening', param: 'awk1', value: 'sparkle' }
		])
	})

	it.each([
		['0', '0'],
		['5', '5'],
		['T3', 't3'],
		['t5', 't5'],
		['6', 't5']
	])('reads uncap %s as %s', (value, uncap) => {
		const { request: parsed } = parseTeamSpread(
			wrap(
				`|char1=Anne|uchar1=${value}|wp1=Ixaba|u1=${value}|main=Zeus|umain=${value}|support=Lucifer|usupport=${value}|s1=Agni|us1=${value}|sub1=Belial|usub1=${value}`
			)
		)
		expect(parsed.characters[0]!.uncap).toBe(uncap)
		expect(parsed.weapons[0]!.uncap).toBe(uncap)
		expect(parsed.summons.map((s) => s.uncap)).toEqual([uncap, uncap, uncap, uncap])
	})

	it('notes uncaps it can not read', () => {
		const { request: parsed, unsupported } = parseTeamSpread(wrap('|wp1=Ixaba|u1=4★'))
		expect(parsed.weapons[0]!.uncap).toBeNull()
		expect(unsupported).toEqual([{ code: 'unknown_uncap', param: 'u1', value: '4★' }])
	})

	it('reads abilities turned off in Full Auto in either style', () => {
		const { request: parsed } = parseTeamSpread(
			wrap('|class=Viking|skilloffmc=3|char1=Threo|skilloff1=1,2, 4|char2=Fraux|skilloff2=32')
		)
		expect(parsed.job.fullAutoOff).toEqual([2])
		expect(parsed.characters.map((c) => c.fullAutoOff)).toEqual([
			[0, 1, 3],
			[1, 2]
		])
	})

	it('treats any ring value as a ring, like the wiki', () => {
		const { request: parsed } = parseTeamSpread(
			wrap('|char1=Caim|ringchar1=true|char2=Seofon|ringchar2=atk|char3=Eahta|ringchar3=')
		)
		expect(parsed.characters.map((c) => c.ring)).toEqual([true, true, false])
	})

	it.each([
		['main', -1],
		['1', 0],
		['4', 3],
		['', null],
		['5', null]
	])('reads quick=%s as %s', (value, quick) => {
		expect(parseTeamSpread(wrap(`|quick=${value}`)).request.quick).toBe(quick)
	})
})

describe('parseTeamSpread with real-world pastes', () => {
	it('reads the template example from Template:TeamSpread', () => {
		const text = `Some page text before the team.

==Team==
{{TeamSpread
|setup={{FASetup}}
|class=Viking|mino=ouro
|char1=Makura (Valentine)|skilloff1=1|redchar1=Bunny
|char2=Uriel|swapchar2=Any {{label|primal}} guy|pluschar2=99
|char3=Cidala|awkchar3=ma
|char4=Eahta|uchar4=t4|passivechar4=3
|char5=Caim|uchar5=5|ringchar5=true
|char6=Caim|uchar6=5|ringchar6=true|artifactchar6=Now there's two of them!
|char7=Lyria (Event SSR)|artchar7=A04
|char8=Lyria (Event)
|skill1=Pandemonium
|skill2=Secret Triad
|skill3=Wild Magica

|mh=Unsigned Kaneshige (Earth)|swapmh={{itm|Higurashi}} but make it earth|awkmh=def
|wp1=Pillardriver|ax1=atk|info1=good pns?|u1=0
|wp2=Harp of Renunciation|awk2=Attack|red2=bad revans?|swap2={{richitm|Ished|showtitle=true}}|u2=t3
|wp3=Ultima Staff
|wp7=Altruism-Soul Staff|bf7=ma
|wp9=Worldvexing Angelos|awk9=Attack
|wp10=Sword of Bahamut Coda
|wp11=
|ccw=humanity
|opus=skill,echo

|main=Zeus|redmain=Better than bubz|swapmain={{richitm|Versusia|showtitle=true}}|umain=0
|support=Yggdrasil Omega|usupport=t4|infosupport=Yggy yay!
|s1=Commander of Destruction|us1=0|infos1=Ugliest Robur
|sub2=The Hanged Man (SSR)|usub2=4|swapsub2=Literally anything when we get the wonders
|quick=main

|source=I made it up
*This is how you do multiple source lines
|comments=Trust me bro it works
|rotation={{Rotation|c=false|
*Press all of MC's buttons
}}
}}
Text Below`
		const { request: parsed, unsupported } = parseTeamSpread(text)
		expect(unsupported).toEqual([])
		expect(parsed.job).toEqual({
			name: 'Viking',
			accessory: 'Ouroboros Mino',
			skills: ['Pandemonium', 'Secret Triad', 'Wild Magica'],
			fullAutoOff: []
		})
		expect(
			parsed.characters.map((c) => [c.position, c.title, c.uncap, c.awakening, c.ring])
		).toEqual([
			[0, 'Makura (Valentine)', null, null, false],
			[1, 'Uriel', null, null, false],
			[2, 'Cidala', null, 'multiattack', false],
			[3, 'Eahta', 't4', null, false],
			[4, 'Caim', '5', null, true],
			[5, 'Caim', '5', null, true],
			[6, 'Lyria (Event SSR)', null, null, false],
			[7, 'Lyria (Event)', null, null, false]
		])
		expect(parsed.characters[0]!.fullAutoOff).toEqual([0])
		expect(parsed.weapons).toEqual([
			{ position: -1, title: 'Unsigned Kaneshige (Earth)', uncap: null, awakening: 'defense' },
			{ position: 0, title: 'Pillardriver', uncap: '0', awakening: null },
			{ position: 1, title: 'Harp of Renunciation', uncap: 't3', awakening: 'attack' },
			{ position: 2, title: 'Ultima Staff', uncap: null, awakening: null },
			{ position: 6, title: 'Altruism-Soul Staff', uncap: null, awakening: null },
			{ position: 8, title: 'Worldvexing Angelos', uncap: null, awakening: 'attack' },
			{ position: 9, title: 'Sword of Bahamut Coda', uncap: null, awakening: null }
		])
		expect(parsed.keys).toEqual({ opus: [13002, 14017], ccw: [1] })
		expect(parsed.summons).toEqual([
			{ position: -1, title: 'Zeus', uncap: '0' },
			{ position: 6, title: 'Yggdrasil Omega', uncap: 't4' },
			{ position: 0, title: 'Commander of Destruction', uncap: '0' },
			{ position: 5, title: 'The Hanged Man (SSR)', uncap: '4' }
		])
		expect(parsed.quick).toBe(-1)
	})

	it('reads params in any order, spacing and case, with comments and links', () => {
		const text = `{{ teamSpread
  | S2 = Mammoth
  |quick = 2
  | char1 = [[Fraux|the best]] <!-- swap for Vira -->
  |CLASS= Soldier
  |  bullets  =  FAA , chaos legion
  | wp1 = Ultima_Gun &amp; Co
  | mh   =   Gun of Proudearth
  |u1=  T2
}}`
		const { request: parsed, unsupported } = parseTeamSpread(text)
		expect(unsupported).toEqual([])
		expect(parsed.job.name).toBe('Soldier')
		expect(parsed.bullets).toEqual(['expert-model-paradise-lost', 'expert-model-chaos-legion'])
		expect(parsed.characters.map((c) => c.title)).toEqual(['Fraux'])
		expect(parsed.weapons).toEqual([
			{ position: -1, title: 'Gun of Proudearth', uncap: null, awakening: null },
			{ position: 0, title: 'Ultima Gun & Co', uncap: 't2', awakening: null }
		])
		expect(parsed.summons).toEqual([{ position: 1, title: 'Mammoth', uncap: null }])
		expect(parsed.quick).toBe(1)
	})

	it('takes the last of a repeated param, like the wiki', () => {
		const { request: parsed } = parseTeamSpread(wrap('|char1=Anne|char1=Fraux'))
		expect(parsed.characters.map((c) => c.title)).toEqual(['Fraux'])
	})

	it('skips titles still holding markup with a note', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			wrap('|char1={{itm|Fraux}}|char2=Anne<br>or Vira|char3=Vira')
		)
		expect(parsed.characters.map((c) => c.title)).toEqual(['Vira'])
		expect(unsupported).toEqual([
			{ code: 'unreadable_value', param: 'char1' },
			{ code: 'unreadable_value', param: 'char2' }
		])
	})

	it('does not end the template at braces inside a free-text param', () => {
		const { request: parsed } = parseTeamSpread(
			wrap('|comments={{Rotation|c=false|\n*Press {{label|FA}}\n}}\n|char1=Anne')
		)
		expect(parsed.characters.map((c) => c.title)).toEqual(['Anne'])
	})

	it('reads a template that is never closed up to the end of the text', () => {
		const { request: parsed } = parseTeamSpread('{{TeamSpread\n|class=Berserker\n|char1=Anne')
		expect(parsed.job.name).toBe('Berserker')
		expect(parsed.characters.map((c) => c.title)).toEqual(['Anne'])
	})

	it('reads only the first team and notes the others', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			`${wrap('|char1=Anne')}\n${wrap('|char1=Fraux')}`
		)
		expect(parsed.characters.map((c) => c.title)).toEqual(['Anne'])
		expect(unsupported).toEqual([{ code: 'multiple_teams' }])
	})

	it('reports the old team= format as unsupported and imports nothing', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			wrap('|team={{Team|class=Berserker|char1=Anne}}\n|weapons={{WeaponGridSkills|mh=Ixaba}}')
		)
		expect(parsed).toEqual(request())
		expect(unsupported).toEqual([{ code: 'old_format' }])
	})

	it('imports the first grid and notes extra grids', () => {
		const { request: parsed, unsupported } = parseTeamSpread(
			wrap('|mh=Ixaba\n|weapons2={{WeaponGridSkills\n|mh=Staff of Renunciation|umh=t3\n}}')
		)
		expect(parsed.weapons).toEqual([{ position: -1, title: 'Ixaba', uncap: null, awakening: null }])
		expect(unsupported).toEqual([{ code: 'multiple_grids' }])
	})

	it('does not mistake other templates for a team', () => {
		expect(() => parseTeamSpread('{{TeamSpread/Old|team=x}} and {{Team|char1=Anne}}')).toThrow(
			WikiImportParseError
		)
		expect(() => parseTeamSpread('just some text')).toThrow(
			expect.objectContaining({ code: 'not_found' })
		)
	})

	it('reads {{Template:TeamSpread}}', () => {
		expect(parseTeamSpread('{{Template:TeamSpread|char1=Anne}}').request.characters).toHaveLength(1)
	})

	it('refuses text over 64 KB, counting bytes', () => {
		const filler = `<!-- ${'x'.repeat(MAX_WIKI_IMPORT_BYTES)} -->`
		expect(() => parseTeamSpread(wrap(filler))).toThrow(
			expect.objectContaining({ code: 'too_large' })
		)
		// 3 bytes per character in UTF-8
		const wide = 'あ'.repeat(Math.ceil(MAX_WIKI_IMPORT_BYTES / 3))
		expect(wide.length).toBeLessThan(MAX_WIKI_IMPORT_BYTES)
		expect(() => parseTeamSpread(wrap(wide))).toThrow(
			expect.objectContaining({ code: 'too_large' })
		)
	})

	it('reads a large, deeply nested paste quickly', () => {
		const nested = '{{a|'.repeat(5000) + '}}'.repeat(5000)
		const text = wrap(`|comments=${nested}\n|char1=Anne`)
		const start = performance.now()
		expect(parseTeamSpread(text).request.characters).toHaveLength(1)
		expect(performance.now() - start).toBeLessThan(500)
	})
})
