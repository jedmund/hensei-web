import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import type { WeaponKey } from '$lib/types/api/entities'
import { ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'

/**
 * Exports a party as a gbf.wiki `{{TeamSpread}}` template call, the format the
 * wiki uses on its team pages.
 *
 * The parameter names and value formats follow GBF-Grid-Maker's exporter
 * (cajunwildcat/GBF-Grid-Maker, `exportWikiText`), which round-trips through
 * the wiki template:
 *
 * - Items are named by their gbf.wiki page (`wiki.en`), falling back to the
 *   English name.
 * - Uncaps are omitted when the item is at its max uncap; otherwise the star
 *   count, or `t1`..`t5` for transcendence stages.
 * - Opus, Ultima, Draconic, Destroyer and Class Champion keys are written once
 *   per team as short labels (`|opus=Skill,Stamina`).
 */

/** Weapon key granblue ID → the TeamSpread parameter and label it exports as. */
const KEY_LABELS: Record<number, { param: KeyParam; label: string }> = {
	// Dark Opus: Pendulums (skill 2) and Pendulums/Chains (skill 3)
	13001: { param: 'opus', label: 'Auto' },
	13002: { param: 'opus', label: 'Skill' },
	13003: { param: 'opus', label: 'Charge Attack' },
	13004: { param: 'opus', label: 'Chain Burst' },
	14001: { param: 'opus', label: 'Stamina' },
	14002: { param: 'opus', label: 'Enmity' },
	14003: { param: 'opus', label: 'Trium' },
	14004: { param: 'opus', label: 'Progression' },
	14005: { param: 'opus', label: 'Extremity' },
	14006: { param: 'opus', label: 'Sagacity' },
	14007: { param: 'opus', label: 'Supremacy' },
	14011: { param: 'opus', label: 'Celere' },
	14012: { param: 'opus', label: 'Majesty' },
	14013: { param: 'opus', label: 'Glory' },
	// Spelled this way by GBF-Grid-Maker; unverified against the template.
	14014: { param: 'opus', label: 'Tempation' },
	14015: { param: 'opus', label: 'Forbiddance' },
	14016: { param: 'opus', label: 'Depravity' },
	14017: { param: 'opus', label: 'Falsehood' },
	// Ultima: Gauph Keys
	10001: { param: 'ultima', label: 'Will' },
	10002: { param: 'ultima', label: 'Strife' },
	10003: { param: 'ultima', label: 'Vitality' },
	10004: { param: 'ultima', label: 'Strength' },
	10005: { param: 'ultima', label: 'Zeal' },
	10006: { param: 'ultima', label: 'Courage' },
	11001: { param: 'ultima', label: 'Auto' },
	11002: { param: 'ultima', label: 'Skill' },
	11003: { param: 'ultima', label: 'Charge Attack' },
	11004: { param: 'ultima', label: 'Chain Burst' },
	17001: { param: 'ultima', label: 'Damage Cap' },
	17002: { param: 'ultima', label: 'Healing Cap' },
	17003: { param: 'ultima', label: 'Seraphic' },
	17004: { param: 'ultima', label: 'Charge Bar Gain' },
	// Draconic: Telumas
	15001: { param: 'draconic', label: 'Endurance Teluma' },
	15002: { param: 'draconic', label: 'Inferno Teluma' },
	15003: { param: 'draconic', label: 'Abyss Teluma' },
	15004: { param: 'draconic', label: 'Crag Teluma' },
	15005: { param: 'draconic', label: 'Tempest Teluma' },
	15006: { param: 'draconic', label: 'Aureole Teluma' },
	15007: { param: 'draconic', label: 'Malice Teluma' },
	15008: { param: 'draconic', label: 'Salvation Teluma' },
	15009: { param: 'draconic', label: 'Oblivion Teluma' },
	16001: { param: 'draconic', label: 'Optimus Teluma' },
	16002: { param: 'draconic', label: 'Omega Teluma' },
	// Destroyer: Anklets
	19001: { param: 'destroyer', label: 'Auto' },
	19002: { param: 'destroyer', label: 'Skill' },
	19003: { param: 'destroyer', label: 'Charge Attack' },
	// Class Champion: Emblems
	1: { param: 'ccw', label: 'Humanity' },
	2: { param: 'ccw', label: 'Divinity' },
	3: { param: 'ccw', label: 'Devilry' }
}

type KeyParam = 'opus' | 'ultima' | 'draconic' | 'destroyer' | 'ccw'

const KEY_PARAMS: KeyParam[] = ['opus', 'ultima', 'draconic', 'destroyer', 'ccw']

const CHARACTER_AWAKENINGS: Record<string, string> = {
	'character-atk': 'attack',
	'character-def': 'defense',
	'character-multi': 'multiattack'
}

const WEAPON_AWAKENINGS: Record<string, string> = {
	'weapon-atk': 'attack',
	'weapon-def': 'defense',
	'weapon-special': 'special',
	'weapon-ca': 'ca',
	'weapon-skill': 'skill',
	'weapon-heal': 'heal'
}

// Series whose element variants share one wiki page outside the mainhand.
const ELEMENT_SUFFIXED_SERIES = ['ultima']

function pageName(item: { wiki?: { en?: string }; name: { en: string } }): string {
	return item.wiki?.en || item.name.en
}

function maxUncap(uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean }): number {
	if (uncap?.transcendence) return 6
	if (uncap?.ulb) return 5
	if (uncap?.flb) return 4
	return 3
}

function uncapValue(uncapLevel: number, transcendenceStep: number | undefined): string {
	return transcendenceStep ? `t${transcendenceStep}` : `${uncapLevel}`
}

function characterParams(gc: GridCharacter | undefined, slot: number): string {
	if (!gc) return ''
	let out = pageName(gc.character)
	const uncap = gc.uncapLevel ?? 0
	if (uncap > 4 || gc.transcendenceStep) {
		out += `|uchar${slot}=${uncapValue(uncap, gc.transcendenceStep)}`
	}
	const awakening = gc.awakening?.type?.slug && CHARACTER_AWAKENINGS[gc.awakening.type.slug]
	if (awakening) out += `|awkchar${slot}=${awakening}`
	return out
}

function weaponParams(gw: GridWeapon | undefined, index: string, keepElement: boolean): string {
	if (!gw) return ''
	let name = pageName(gw.weapon)
	if (!keepElement && ELEMENT_SUFFIXED_SERIES.includes(gw.weapon.series?.slug ?? '')) {
		name = name.split('(')[0]!.trim()
	}
	let out = name

	const uncap = gw.uncapLevel ?? 0
	const max = maxUncap(gw.weapon.uncap)
	const atMax =
		(uncap === max && max !== 6) || (gw.weapon.series?.slug === 'dark-opus' && uncap === 5)
	if (!atMax) out += `|u${index}=${uncapValue(uncap, gw.transcendenceStep)}`

	const awakening = gw.awakening?.type?.slug && WEAPON_AWAKENINGS[gw.awakening.type.slug]
	if (awakening) out += `|awk${index}=${awakening}`
	return out
}

function summonParams(gs: GridSummon | undefined, slot: string): string {
	if (!gs) return ''
	const name = pageName(gs.summon)
	const uncap = gs.uncapLevel ?? 0
	const max = maxUncap(gs.summon.uncap)
	if (gs.transcendenceStep === 5 || (uncap === max && max !== 6)) return name
	return `${name}|u${slot}=${uncapValue(uncap, gs.transcendenceStep)}`
}

function keyParams(weapons: GridWeapon[]): string {
	const labels: Record<KeyParam, string[]> = {
		opus: [],
		ultima: [],
		draconic: [],
		destroyer: [],
		ccw: []
	}
	for (const gw of weapons) {
		const keys = [...(gw.weaponKeys ?? [])].sort((a: WeaponKey, b: WeaponKey) => a.slot - b.slot)
		for (const key of keys) {
			const mapped = KEY_LABELS[key.granblueId]
			// The template takes one set of keys per series, like the game allows.
			if (mapped && !labels[mapped.param].includes(mapped.label)) {
				labels[mapped.param].push(mapped.label)
			}
		}
	}
	return KEY_PARAMS.filter((param) => labels[param].length > 0)
		.map((param) => `\n|${param}=${labels[param].join(',')}`)
		.join('')
}

/**
 * Bullets on the mainhand, by full name in slot order. Empty slots stay as
 * blanks so later bullets keep their position; trailing blanks are dropped.
 * GBF-Grid-Maker writes short aliases instead ("iron" for every Iron Bullet
 * tier), which loses the tier; its importer also accepts full names.
 */
function bulletParams(mainhand: GridWeapon | undefined): string {
	const loadout = mainhand?.bullets ?? []
	if (loadout.length === 0) return ''
	const names: string[] = []
	for (const { position, bullet } of loadout) names[position] = bullet.name.en
	const filled = Array.from(names, (n) => n ?? '')
	while (filled.length > 0 && !filled[filled.length - 1]) filled.pop()
	return filled.length > 0 ? `|bullets=${filled.join(',')}` : ''
}

export function partyToWikiText(party: Party): string {
	const characterAt = (position: number) => party.characters.find((c) => c.position === position)
	const weaponAt = (position: number) =>
		party.weapons.find((w) =>
			position === -1 ? w.mainhand || w.position === -1 : w.position === position && !w.mainhand
		)
	const summonAt = (position: number) =>
		party.summons.find((s) => {
			if (position === -1) return s.main || s.position === -1
			if (position === 6) return s.friend || s.position === 6
			return s.position === position && !s.main && !s.friend
		})

	const job = party.job
	const accessory = party.accessory
	let classLine = `|class=${job?.name.en ?? ''}`
	if (accessory && job?.accessoryType === ACCESSORY_TYPES.MANATURA)
		classLine += `|mino=${accessory.name.en}`
	if (accessory && job?.accessoryType === ACCESSORY_TYPES.SHIELD)
		classLine += `|shield=${accessory.name.en}`
	classLine += bulletParams(weaponAt(-1))

	const unlimited = party.characters.some((c) => c.position >= 5)
	const characterCount = unlimited ? 8 : 5
	const characterLines = Array.from(
		{ length: characterCount },
		(_, i) => `|char${i + 1}=${characterParams(characterAt(i), i + 1)}`
	)

	const skillLines = [1, 2, 3].map(
		(slot) => `|skill${slot}=${party.jobSkills?.[slot as 1 | 2 | 3]?.name.en ?? ''}`
	)

	// An aux-weapon class holds a second element-specific weapon in slot 1.
	const auxWeapon = !!job?.auxWeapon
	const extraWeapons = party.weapons.some((w) => w.position >= 9)
	const weaponCount = extraWeapons ? 12 : 9
	const weaponLines = [
		`|mh=${weaponParams(weaponAt(-1), 'mh', true)}`,
		...Array.from({ length: weaponCount }, (_, i) => {
			const index = i + 1
			return `|wp${index}=${weaponParams(weaponAt(i), `${index}`, auxWeapon && i === 0)}`
		})
	]

	const quick = party.summons.find((s) => s.quickSummon)
	let quickValue = ''
	if (quick?.main || quick?.position === -1) quickValue = 'main'
	else if (quick && quick.position >= 0 && quick.position <= 3) quickValue = `${quick.position + 1}`

	const summonLines = [
		`|main=${summonParams(summonAt(-1), 'main')}`,
		`|support=${summonParams(summonAt(6), 'support')}`,
		...[0, 1, 2, 3].map((p) => `|s${p + 1}=${summonParams(summonAt(p), `s${p + 1}`)}`),
		`|sub1=${summonParams(summonAt(4), 'sub1')}`,
		`|sub2=${summonParams(summonAt(5), 'sub2')}`,
		`|quick=${quickValue}`
	]

	return [
		'{{TeamSpread',
		classLine,
		...characterLines,
		...skillLines,
		'',
		weaponLines.join('\n') + keyParams(party.weapons),
		'',
		...summonLines,
		'',
		'|source=',
		'|setup=',
		'|comments=',
		'|rotation=',
		'}}'
	].join('\n')
}
