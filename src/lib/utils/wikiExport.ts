import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import type { WeaponKey } from '$lib/types/api/entities'
import { ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'

/**
 * Exports a party as a gbf.wiki `{{TeamSpread}}` template call, the format the
 * wiki uses on its team pages.
 *
 * Parameter names and values follow the template's source on gbf.wiki:
 * Template:TeamSpread wraps Template:Team (class, characters, bullets),
 * Template:WeaponGridSkills (weapons, with keys resolved by Module:WeaponGrid)
 * and Template:SummonGrid.
 *
 * - Items are named by their gbf.wiki page (`wiki.en`), falling back to the
 *   English name. The wiki looks items up by page name, so a wrong name loses
 *   its art and skill icons.
 * - Uncaps are omitted when the item is at its max uncap; otherwise the star
 *   count, or `t1`..`t5` for transcendence stages.
 * - Element-changed weapons are named by their `Name (Element)` page where the
 *   wiki has one.
 * - Opus, Ultima, Draconic, Destroyer and Class Champion keys are written once
 *   per team (`|opus=skill,stamina`).
 */

/**
 * Weapon key granblue ID → the TeamSpread parameter and the alias
 * Module:WeaponGrid accepts for it. The module lowercases the value, splits it
 * on commas and reads each skill slot by position, so aliases are single words
 * and a key's `slot` is its position in the list.
 */
const KEY_VALUES: Record<number, { param: KeyParam; value: string }> = {
	// Dark Opus: Pendulums (skill 2) and Pendulums/Chains (skill 3)
	13001: { param: 'opus', value: 'auto' },
	13002: { param: 'opus', value: 'skill' },
	13003: { param: 'opus', value: 'ca' },
	13004: { param: 'opus', value: 'cb' },
	14001: { param: 'opus', value: 'stamina' },
	14002: { param: 'opus', value: 'enmity' },
	14003: { param: 'opus', value: 'trium' },
	14004: { param: 'opus', value: 'progression' },
	14005: { param: 'opus', value: 'extremity' },
	14006: { param: 'opus', value: 'sagacity' },
	14007: { param: 'opus', value: 'supremacy' },
	14011: { param: 'opus', value: 'celere' },
	14012: { param: 'opus', value: 'majesty' },
	14013: { param: 'opus', value: 'glory' },
	14014: { param: 'opus', value: 'temptation' },
	14015: { param: 'opus', value: 'forbiddance' },
	14016: { param: 'opus', value: 'depravity' },
	14017: { param: 'opus', value: 'falsehood' },
	// Ultima: Gauph Keys
	10001: { param: 'ultima', value: 'will' },
	10002: { param: 'ultima', value: 'strife' },
	10003: { param: 'ultima', value: 'vitality' },
	10004: { param: 'ultima', value: 'strength' },
	10005: { param: 'ultima', value: 'zeal' },
	10006: { param: 'ultima', value: 'courage' },
	11001: { param: 'ultima', value: 'auto' },
	11002: { param: 'ultima', value: 'skill' },
	11003: { param: 'ultima', value: 'ca' },
	11004: { param: 'ultima', value: 'cb' },
	17001: { param: 'ultima', value: 'cap' },
	17002: { param: 'ultima', value: 'healing' },
	17003: { param: 'ultima', value: 'seraphic' },
	17004: { param: 'ultima', value: 'cbgain' },
	// Draconic and Draconic Provenance: Telumas
	15001: { param: 'draconic', value: 'endurance' },
	15002: { param: 'draconic', value: 'inferno' },
	15003: { param: 'draconic', value: 'abyss' },
	15004: { param: 'draconic', value: 'crag' },
	15005: { param: 'draconic', value: 'tempest' },
	15006: { param: 'draconic', value: 'aureole' },
	15007: { param: 'draconic', value: 'malice' },
	15008: { param: 'draconic', value: 'salvation' },
	15009: { param: 'draconic', value: 'oblivion' },
	16001: { param: 'draconic', value: 'optimus' },
	16002: { param: 'draconic', value: 'omega' },
	// Destroyer: Anklets
	19001: { param: 'destroyer', value: 'auto' },
	19002: { param: 'destroyer', value: 'skill' },
	19003: { param: 'destroyer', value: 'ca' },
	// Class Champion: Emblems
	1: { param: 'ccw', value: 'humanity' },
	2: { param: 'ccw', value: 'divinity' },
	3: { param: 'ccw', value: 'devilry' }
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
	'weapon-heal': 'heal',
	'weapon-multi': 'multiattack'
}

/**
 * Bullet slug → the alias Template:Team/Bullets accepts. The template only
 * knows these bullets, each at one tier, and matches aliases case-sensitively;
 * anything else renders nothing, so it isn't exported.
 */
const BULLET_ALIASES: Record<string, string> = {
	'iron-bullet-v': 'iron',
	'full-metal-jacket-v': 'fmj',
	'expert-model-paradise-lost': 'faa',
	'expert-model-chaos-legion': 'chaos legion',
	'expert-model-anagenesis': 'anagenesis',
	'expert-model-genesis-nova': 'genesis nova',
	'expert-model-rationale-exitium': 'rationale exitium',
	'expert-model-anti-vasileia': 'anti vasileia',
	'expert-model-apocalypse': 'apocalypse',
	'expert-model-hexachromatic': 'hexachromatic',
	'slug-shot-ii': 'slug',
	'chaser-shell': 'chaser',
	'enhancing-shell': 'enhancing',
	'agni-point-iv': 'agni',
	'neptune-point-iv': 'neptune',
	'titan-point-iv': 'titan',
	'zephyrus-point-iv': 'zephyrus',
	'zeus-point-iv': 'zeus',
	'hades-point-iv': 'hades'
}

/** Grid element → the suffix gbf.wiki uses on element-changed weapon pages. */
const WIKI_ELEMENTS: Record<number, string> = {
	1: 'Wind',
	2: 'Fire',
	3: 'Water',
	4: 'Earth',
	5: 'Dark',
	6: 'Light'
}

/**
 * Series whose element-changed weapons have `Name (Fire)`..`Name (Dark)` pages
 * on gbf.wiki. Checked against the wiki's page list: every Ultima, Atma and
 * Superlative weapon has them, Revenant weapons have none, and Class Champion
 * weapons have them except for those in NO_ELEMENT_PAGES.
 */
const ELEMENT_PAGE_SERIES = new Set(['ultima', 'superlative', 'class-champion'])

/** Class Champion weapons gbf.wiki has no element pages for. */
const NO_ELEMENT_PAGES = new Set([
	'Arabesque',
	'Aschallon',
	'Avenger',
	'Faust',
	'Hellion Gauntlet',
	'Ipetam',
	'Kapilavastu',
	'Keraunos',
	'Langeleik',
	'Misericorde',
	'Murakumo',
	'Muramasa',
	'Nebuchad',
	'Nirvana',
	'Oliver',
	'Proximo',
	'Romulus Spear',
	'Rosenbogen',
	'Skofnung',
	'Soul Echoer'
])

function pageName(item: { wiki?: { en?: string }; name: { en: string } }): string {
	return item.wiki?.en || item.name.en
}

/** A weapon's page, or its `Name (Element)` page when its element was changed. */
function weaponPageName(gw: GridWeapon): string {
	const page = pageName(gw.weapon)
	const element = gw.element ? WIKI_ELEMENTS[gw.element] : undefined
	const hasElementPages =
		ELEMENT_PAGE_SERIES.has(gw.weapon.series?.slug ?? '') && !NO_ELEMENT_PAGES.has(page)
	return element && hasElementPages ? `${page} (${element})` : page
}

/** Max uncap on the wiki's scale: stars 3-5, or 10 for t5. */
function maxUncap(uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean }): number {
	if (uncap?.transcendence) return 10
	if (uncap?.ulb) return 5
	if (uncap?.flb) return 4
	return 3
}

/**
 * An item's uncap on the wiki's scale: stars 0-5, then 6-10 for `t1`..`t5`.
 * The transcendence step decides it when set; uncap 6 without a step is 5★,
 * which the wiki would otherwise read as fully transcended.
 */
function wikiUncap(item: { uncapLevel?: number; transcendenceStep?: number }): number {
	const step = item.transcendenceStep ?? 0
	if (step > 0) return 5 + Math.min(step, 5)
	return Math.min(item.uncapLevel ?? 0, 5)
}

function uncapValue(level: number): string {
	return level > 5 ? `t${level - 5}` : `${level}`
}

function characterParams(gc: GridCharacter | undefined, slot: number): string {
	if (!gc) return ''
	let out = pageName(gc.character)
	// Below 5★ the wiki shows the same art as with no uncap.
	const uncap = wikiUncap(gc)
	if (uncap >= 5) out += `|uchar${slot}=${uncapValue(uncap)}`
	const awakening = gc.awakening?.type?.slug && CHARACTER_AWAKENINGS[gc.awakening.type.slug]
	if (awakening) out += `|awkchar${slot}=${awakening}`
	return out
}

function weaponParams(gw: GridWeapon | undefined, index: string): string {
	if (!gw) return ''
	let out = weaponPageName(gw)

	// Transcendable weapons always get an uncap, except Dark Opus at 5★.
	const uncap = wikiUncap(gw)
	const max = maxUncap(gw.weapon.uncap)
	const atMax =
		(uncap === max && max <= 5) || (gw.weapon.series?.slug === 'dark-opus' && uncap === 5)
	if (!atMax) out += `|u${index}=${uncapValue(uncap)}`

	const awakening = gw.awakening?.type?.slug && WEAPON_AWAKENINGS[gw.awakening.type.slug]
	if (awakening) out += `|awk${index}=${awakening}`
	return out
}

function summonParams(gs: GridSummon | undefined, slot: string): string {
	if (!gs) return ''
	const name = pageName(gs.summon)
	const uncap = wikiUncap(gs)
	if (uncap === maxUncap(gs.summon.uncap)) return name
	return `${name}|u${slot}=${uncapValue(uncap)}`
}

function keyParams(weapons: GridWeapon[]): string {
	const values: Partial<Record<KeyParam, string[]>> = {}
	// The template takes one set of keys per series, like the game allows, so
	// the first weapon of each series (mainhand first) decides it.
	const ordered = [...weapons].sort(
		(a, b) => (a.mainhand ? -1 : a.position) - (b.mainhand ? -1 : b.position)
	)
	for (const gw of ordered) {
		const keys = (gw.weaponKeys ?? []).flatMap((key: WeaponKey) => {
			const mapped = KEY_VALUES[key.granblueId]
			return mapped ? [{ ...mapped, slot: key.slot }] : []
		})
		const param = keys[0]?.param
		if (!param || values[param]) continue
		const slots: string[] = []
		for (const key of keys) slots[key.slot] = key.value
		values[param] = Array.from(slots, (value) => value ?? '')
	}
	return KEY_PARAMS.filter((param) => values[param])
		.map((param) => `\n|${param}=${values[param]!.join(',')}`)
		.join('')
}

/**
 * Bullets on the mainhand, as Template:Team/Bullets aliases in slot order.
 * The wiki shows them as a flat list, so empty slots and bullets it doesn't
 * know are left out.
 */
function bulletParams(mainhand: GridWeapon | undefined): string {
	const aliases = [...(mainhand?.bullets ?? [])]
		.sort((a, b) => a.position - b.position)
		.flatMap(({ bullet }) => BULLET_ALIASES[bullet.slug] ?? [])
	return aliases.length > 0 ? `|bullets=${aliases.join(',')}` : ''
}

/** Escapes text for an external link's label inside a template parameter. */
function linkLabel(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/[|[\]{}]/g, (c) => `&#${c.charCodeAt(0)};`)
		.trim()
}

/**
 * `url` is the team's page on granblue.team. It's written as the template's
 * source, which the wiki shows under the team, so the wiki links back to it.
 */
export function partyToWikiText(party: Party, { url }: { url?: string } = {}): string {
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
		classLine += `|mino=${accessory.name.en.trim()}`
	if (accessory && job?.accessoryType === ACCESSORY_TYPES.SHIELD)
		classLine += `|shield=${accessory.name.en.trim()}`
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

	const extraWeapons = party.weapons.some((w) => w.position >= 9)
	const weaponCount = extraWeapons ? 12 : 9
	const weaponLines = [
		`|mh=${weaponParams(weaponAt(-1), 'mh')}`,
		...Array.from({ length: weaponCount }, (_, i) => {
			const index = i + 1
			return `|wp${index}=${weaponParams(weaponAt(i), `${index}`)}`
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
		`|source=${url ? `[${url} ${linkLabel(party.name || 'This team')} on granblue.team]` : ''}`,
		'|setup=',
		'|comments=',
		'|rotation=',
		'}}'
	].join('\n')
}
