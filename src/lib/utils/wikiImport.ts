import type {
	WikiCharacterAwakening,
	WikiImportCharacter,
	WikiImportRequest,
	WikiImportSummon,
	WikiImportWeapon,
	WikiUncap,
	WikiWeaponAwakening
} from '$lib/types/api/wikiImport'
import {
	BULLET_SLUGS,
	CHARACTER_AWAKENING_ALIASES,
	KEY_IMPORT_IDS,
	KEY_PARAMS,
	MINO_ALIASES,
	SHIELD_ALIASES,
	WEAPON_AWAKENING_ALIASES
} from '$lib/utils/wikiAliases'

/**
 * Reads a gbf.wiki `{{TeamSpread}}` template call into the request for
 * `POST /import/wiki`. The reverse of `partyToWikiText` (`wikiExport.ts`).
 *
 * - Only the first TeamSpread call in the text is read; text around it is
 *   ignored. Parameters can come in any order, with any whitespace.
 * - Items are sent as the titles on the page; the API resolves them.
 * - Aliases for keys, bullets, awakenings, manatura and shields are mapped to
 *   hensei's values with the tables in `wikiAliases.ts`.
 * - Free text (info, red, swap, source, setup, comments, rotation…) and
 *   anything else hensei can't store is skipped. What can't be imported is
 *   listed in `unsupported`.
 */

/** The API rejects bodies over 64 KB, so longer pastes are refused up front. */
export const MAX_WIKI_IMPORT_BYTES = 64 * 1024

export type WikiImportNoteCode =
	| 'old_format'
	| 'multiple_grids'
	| 'multiple_teams'
	| 'primal_bullet'
	| 'unknown_bullet'
	| 'unknown_key'
	| 'unknown_awakening'
	| 'unknown_uncap'
	| 'unreadable_value'

/** Something on the page that can't be imported. `param` is the template parameter. */
export interface WikiImportNote {
	code: WikiImportNoteCode
	param?: string
	value?: string
}

export interface WikiImportParseResult {
	request: WikiImportRequest
	unsupported: WikiImportNote[]
}

export class WikiImportParseError extends Error {
	constructor(readonly code: 'too_large' | 'not_found') {
		super(code === 'too_large' ? 'Wikitext is too large' : 'No TeamSpread template found')
		this.name = 'WikiImportParseError'
	}
}

const TEMPLATE_START = /\{\{\s*(?:template\s*:\s*)?teamspread\s*(?=[|}])/gi

const WEAPON_SLOTS: [string, number][] = [
	['mh', -1],
	...Array.from({ length: 12 }, (_, i): [string, number] => [`${i + 1}`, i])
]

const SUMMON_SLOTS: [string, number][] = [
	['main', -1],
	['support', 6],
	['s1', 0],
	['s2', 1],
	['s3', 2],
	['s4', 3],
	['sub1', 4],
	['sub2', 5]
]

/** Parses pasted wikitext. Throws `WikiImportParseError` when it's too large or has no team. */
export function parseTeamSpread(text: string): WikiImportParseResult {
	if (text.length > MAX_WIKI_IMPORT_BYTES) throw new WikiImportParseError('too_large')
	if (new TextEncoder().encode(text).byteLength > MAX_WIKI_IMPORT_BYTES)
		throw new WikiImportParseError('too_large')

	const source = stripComments(text)
	const starts = [...source.matchAll(TEMPLATE_START)]
	const first = starts[0]
	if (!first) throw new WikiImportParseError('not_found')

	const unsupported: WikiImportNote[] = []
	if (starts.length > 1) unsupported.push({ code: 'multiple_teams' })

	const params = readParams(source, (first.index ?? 0) + first[0].length)
	const reader = new ParamReader(params, unsupported)

	// The old format (`team=`) renders through a different template and
	// ignores every other parameter.
	if (reader.raw('team')) {
		unsupported.push({ code: 'old_format' })
		return { request: emptyRequest(), unsupported }
	}
	if (reader.raw('weapons2') || reader.raw('weapons3')) unsupported.push({ code: 'multiple_grids' })

	return {
		request: {
			job: {
				name: reader.title('class'),
				accessory: reader.accessory(),
				skills: [reader.title('skill1'), reader.title('skill2'), reader.title('skill3')],
				fullAutoOff: reader.skillsOff('skilloffmc')
			},
			bullets: reader.bullets(),
			characters: reader.characters(),
			weapons: reader.weapons(),
			keys: reader.keys(),
			summons: reader.summons(),
			quick: reader.quick()
		},
		unsupported
	}
}

/** True when the request has nothing to import. */
export function isEmptyWikiImport(request: WikiImportRequest): boolean {
	return (
		!request.job.name &&
		!request.job.accessory &&
		request.job.skills.every((s) => !s) &&
		request.bullets.length === 0 &&
		request.characters.length === 0 &&
		request.weapons.length === 0 &&
		request.summons.length === 0 &&
		Object.keys(request.keys).length === 0
	)
}

function emptyRequest(): WikiImportRequest {
	return {
		job: { name: null, accessory: null, skills: [null, null, null], fullAutoOff: [] },
		bullets: [],
		characters: [],
		weapons: [],
		keys: {},
		summons: [],
		quick: null
	}
}

/** Drops `<!-- … -->` comments, which the wiki ignores. */
function stripComments(text: string): string {
	let out = ''
	let from = 0
	for (;;) {
		const open = text.indexOf('<!--', from)
		if (open === -1) return out + text.slice(from)
		out += text.slice(from, open)
		const close = text.indexOf('-->', open + 4)
		if (close === -1) return out
		from = close + 3
	}
}

/**
 * Splits a template call's parameters on the `|`s that aren't inside a
 * nested template or link, up to the call's closing `}}` (or the end of the
 * text if it's never closed). Named parameters only; the last one wins, like
 * on the wiki. One pass, no backtracking.
 */
function readParams(text: string, start: number): Map<string, string> {
	const parts: string[] = []
	let templates = 0
	let links = 0
	let from = start
	let i = start
	while (i < text.length) {
		const pair = text.slice(i, i + 2)
		if (pair === '{{') {
			templates++
			i += 2
		} else if (pair === '}}') {
			if (templates === 0) break
			templates--
			i += 2
		} else if (pair === '[[') {
			links++
			i += 2
		} else if (pair === ']]') {
			if (links > 0) links--
			i += 2
		} else {
			if (text[i] === '|' && templates === 0 && links === 0) {
				parts.push(text.slice(from, i))
				from = i + 1
			}
			i++
		}
	}
	parts.push(text.slice(from, i))

	const params = new Map<string, string>()
	// The first part is whatever follows the template name, before the first `|`.
	for (const part of parts.slice(1)) {
		const eq = part.indexOf('=')
		if (eq === -1) continue
		const name = part.slice(0, eq).trim().toLowerCase()
		if (!name || /[{}[\]]/.test(name)) continue
		params.set(name, part.slice(eq + 1).trim())
	}
	return params
}

const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&quot;': '"',
	'&#39;': "'",
	'&apos;': "'",
	'&#34;': '"',
	'&nbsp;': ' '
}

class ParamReader {
	constructor(
		private params: Map<string, string>,
		private notes: WikiImportNote[]
	) {}

	raw(param: string): string {
		return this.params.get(param) ?? ''
	}

	/**
	 * A page title or name: `[[Link]]` and `[[Link|Label]]` read as the link,
	 * underscores as spaces. Anything still holding markup can't be read.
	 */
	title(param: string): string | null {
		let value = this.raw(param)
		if (!value) return null
		const link = value.startsWith('[[') && value.endsWith(']]') ? value.slice(2, -2) : null
		if (link !== null) value = link.split('|')[0] ?? ''
		value = value
			.replace(/&(?:amp|quot|#39|apos|#34|nbsp);/g, (e) => ENTITIES[e] ?? e)
			.replace(/_/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
		if (!value) return null
		if (/[{}[\]|<>]/.test(value) || value.length > 200) {
			this.notes.push({ code: 'unreadable_value', param })
			return null
		}
		return value
	}

	/** Lowercased, for alias lookups. */
	private alias(param: string): string {
		return this.raw(param).toLowerCase().replace(/\s+/g, ' ')
	}

	/**
	 * The manatura or shield. Aliases map to the full name; anything else is
	 * sent as written (the wiki's own fallback for manatura), for the API to match.
	 */
	accessory(): string | null {
		for (const [param, table] of [
			['mino', MINO_ALIASES],
			['shield', SHIELD_ALIASES]
		] as const) {
			const alias = this.alias(param)
			if (!alias) continue
			return table[alias] ?? this.title(param)
		}
		return null
	}

	/** Ability numbers 1-4 as Template:Team/DisabledSkills reads them (`13`, `1,3`) → 0-based slots. */
	skillsOff(param: string): number[] {
		const digits = new Set(this.raw(param).match(/[1-4]/g) ?? [])
		return [...digits].map((d) => Number(d) - 1).sort((a, b) => a - b)
	}

	uncap(param: string): WikiUncap | null {
		const value = this.alias(param)
		if (!value) return null
		if (value === '6') return 't5'
		if (/^(?:[0-5]|t[1-5])$/.test(value)) return value as WikiUncap
		this.notes.push({ code: 'unknown_uncap', param, value: this.raw(param) })
		return null
	}

	private awakening<T extends string>(param: string, table: Record<string, string>): T | null {
		const value = this.raw(param)
		if (!value) return null
		const key = value.toLowerCase().replace(/[^a-z0-9]/g, '')
		const awakening = table[key]
		if (awakening) return awakening as T
		this.notes.push({ code: 'unknown_awakening', param, value })
		return null
	}

	bullets(): string[] {
		return this.alias('bullets')
			.split(',')
			.map((alias) => alias.trim())
			.filter(Boolean)
			.flatMap((alias) => {
				const slug = BULLET_SLUGS.get(alias)
				if (slug) return [slug]
				this.notes.push(
					alias === 'primal'
						? { code: 'primal_bullet', param: 'bullets', value: alias }
						: { code: 'unknown_bullet', param: 'bullets', value: alias }
				)
				return []
			})
	}

	characters(): WikiImportCharacter[] {
		return Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => {
			const title = this.title(`char${n}`)
			if (!title) return []
			return [
				{
					position: n - 1,
					title,
					uncap: this.uncap(`uchar${n}`),
					awakening: this.awakening<WikiCharacterAwakening>(
						`awkchar${n}`,
						CHARACTER_AWAKENING_ALIASES
					),
					// The wiki shows the ring for any value
					ring: !!this.raw(`ringchar${n}`),
					fullAutoOff: this.skillsOff(`skilloff${n}`)
				}
			]
		})
	}

	weapons(): WikiImportWeapon[] {
		return WEAPON_SLOTS.flatMap(([slot, position]) => {
			const param = slot === 'mh' ? 'mh' : `wp${slot}`
			const title = this.title(param)
			if (!title) return []
			return [
				{
					position,
					title,
					uncap: this.uncap(`u${slot}`),
					awakening: this.awakening<WikiWeaponAwakening>(`awk${slot}`, WEAPON_AWAKENING_ALIASES)
				}
			]
		})
	}

	summons(): WikiImportSummon[] {
		return SUMMON_SLOTS.flatMap(([param, position]) => {
			const title = this.title(param)
			if (!title) return []
			return [{ position, title, uncap: this.uncap(`u${param}`) }]
		})
	}

	/**
	 * Keys by slot, read like Module:WeaponGrid: the value lowercased, split on
	 * commas, each alias by its position. Trailing empty slots are dropped.
	 */
	keys(): WikiImportRequest['keys'] {
		const keys: WikiImportRequest['keys'] = {}
		for (const param of KEY_PARAMS) {
			const value = this.alias(param)
			if (!value) continue
			const parts = value.split(',')
			const ids = KEY_IMPORT_IDS[param].map((aliases, slot) => {
				const alias = parts[slot]?.trim()
				if (!alias) return null
				const id = aliases.get(alias)
				if (id === undefined) this.notes.push({ code: 'unknown_key', param, value: alias })
				return id ?? null
			})
			while (ids.length > 0 && ids[ids.length - 1] === null) ids.pop()
			if (ids.length > 0) keys[param] = ids
		}
		return keys
	}

	quick(): number | null {
		const value = this.alias('quick').trim()
		if (value === 'main') return -1
		if (/^[1-4]$/.test(value)) return Number(value) - 1
		return null
	}
}
