/**
 * Request and response shapes for importing a gbf.wiki TeamSpread team
 * (`POST /import/wiki`). The web app parses the wikitext into the request;
 * the API resolves the titles and creates the party.
 */
import type { Party } from '$lib/types/api/party'
import type { KeyParam } from '$lib/utils/wikiAliases'

/**
 * `null` when the page leaves the uncap out (the item's max uncap in hensei),
 * `'0'`–`'5'` stars, or `'t1'`–`'t5'` transcendence steps.
 */
export type WikiUncap = '0' | '1' | '2' | '3' | '4' | '5' | 't1' | 't2' | 't3' | 't4' | 't5'

export type WikiCharacterAwakening = 'attack' | 'defense' | 'multiattack'
export type WikiWeaponAwakening = WikiCharacterAwakening | 'special' | 'ca' | 'skill' | 'heal'

export interface WikiImportJob {
	/** The class's English name */
	name: string | null
	/** A manatura or shield English name */
	accessory: string | null
	/** The three subskill English names */
	skills: [string | null, string | null, string | null]
	/** 0-based MC ability slots turned off in Full Auto (0 = the class's own skill) */
	fullAutoOff: number[]
}

export interface WikiImportCharacter {
	/** 0–7; 5 and up is an unlimited party */
	position: number
	title: string
	uncap: WikiUncap | null
	awakening: WikiCharacterAwakening | null
	ring: boolean
	fullAutoOff: number[]
}

export interface WikiImportWeapon {
	/** -1 mainhand, 0–8 grid, 9–11 extra slots */
	position: number
	title: string
	uncap: WikiUncap | null
	awakening: WikiWeaponAwakening | null
}

export interface WikiImportSummon {
	/** -1 main, 6 support, 0–3 grid, 4–5 sub summons */
	position: number
	title: string
	uncap: WikiUncap | null
}

/** The `wiki` object of the request, without `preview`. */
export interface WikiImportRequest {
	job: WikiImportJob
	/** Hensei bullet slugs in slot order */
	bullets: string[]
	characters: WikiImportCharacter[]
	weapons: WikiImportWeapon[]
	/** Weapon key granblue IDs by key slot, per series (`null` for an empty slot) */
	keys: Partial<Record<KeyParam, (number | null)[]>>
	summons: WikiImportSummon[]
	/** Summon position of the quick summon */
	quick: number | null
}

export type WikiImportKind =
	'character' | 'weapon' | 'summon' | 'job' | 'accessory' | 'skill' | 'bullet' | 'key'

export interface WikiImportItem {
	id: string
	granblueId?: string
	name: { en: string; ja?: string }
	element?: number | null
}

export interface WikiImportMatch {
	kind: WikiImportKind
	position: number
	title: string
	item: WikiImportItem
}

export interface WikiImportUnmatched {
	kind: WikiImportKind
	position: number
	title: string
}

export interface WikiImportAmbiguous extends WikiImportUnmatched {
	candidates: WikiImportItem[]
}

export interface WikiImportWarning {
	code: string
	detail?: string
}

export interface WikiImportReport {
	matched: WikiImportMatch[]
	unmatched: WikiImportUnmatched[]
	ambiguous: WikiImportAmbiguous[]
	warnings: WikiImportWarning[]
}

export interface WikiImportResponse {
	/** The created party on create (with its edit key when anonymous); null on preview */
	party: Party | null
	report: WikiImportReport
}
