#!/usr/bin/env node
/**
 * Keeps the Updates page data in step with the catalogue.
 *
 *   pnpm updates:sync                    regenerate src/lib/data/updateNames.json
 *   pnpm updates:sync --order 2026-10L   also order the weapons (and characters) in these entries
 *
 * Names: every character, style, weapon, summon, class, Manatura, shield and raid
 * referenced in updates.json gets its English and Japanese name, so the page can
 * label items without fetching them.
 *
 * Ordering (--order, only for the entries you name, so hand-ordered entries are
 * left alone): character weapons first, grouped by element, with the characters in
 * the same order; then the other weapons, SSR before SR, each grouped by element.
 * Uncapped, transcended and awakened weapons are grouped by element.
 *
 * Reads the catalogue with psql. Set DATABASE_URL to point at another database
 * (default: hensei_dev).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const UPDATES = `${root}src/lib/data/updates.json`
const NAMES = `${root}src/lib/data/updateNames.json`
const database = process.env.DATABASE_URL || 'hensei_dev'

function query(sql) {
	const out = execFileSync('psql', [database, '-AtF', '\t', '-c', sql], { encoding: 'utf8' })
	return out
		.split('\n')
		.filter(Boolean)
		.map((line) => line.split('\t'))
}

function idList(ids) {
	for (const id of ids) {
		if (!/^[\w-]+$/.test(id)) throw new Error(`Unexpected id in updates.json: ${id}`)
	}
	return ids.size ? [...ids].map((id) => `'${id}'`).join(',') : "''"
}

const data = JSON.parse(readFileSync(UPDATES, 'utf8'))
const entries = data.flatMap((year) => year.entries)

// --- Weapon ordering -------------------------------------------------------

const orderIndex = process.argv.indexOf('--order')
const toOrder = new Set(orderIndex === -1 ? [] : process.argv.slice(orderIndex + 1))

if (toOrder.size) {
	const weapons = new Map(
		query('select granblue_id, element, rarity, recruits from weapons').map(
			([id, element, rarity, recruits]) => [
				id,
				{ element: Number(element || 0), rarity: Number(rarity || 0), recruits: recruits || null }
			]
		)
	)
	// Game order: Fire, Water, Earth, Wind, Light, Dark, then non-elemental (internal ids 2,3,4,1,6,5,0)
	const rank = { 2: 0, 3: 1, 4: 2, 1: 3, 6: 4, 5: 5, 0: 6 }
	const info = (id) => weapons.get(id) ?? { element: 0, rarity: 0, recruits: null }
	const byElement = (a, b) =>
		(rank[info(a).element] ?? 6) - (rank[info(b).element] ?? 6) || a.localeCompare(b)
	const byRarityThenElement = (a, b) => info(b).rarity - info(a).rarity || byElement(a, b)

	for (const entry of entries) {
		if (!toOrder.delete(entry.version)) continue
		const added = entry.new
		if (added?.weapons?.length) {
			const characters = added.characters ?? []
			const characterWeapons = added.weapons
				.filter((id) => characters.includes(info(id).recruits))
				.sort(byElement)
			const others = added.weapons
				.filter((id) => !characterWeapons.includes(id))
				.sort(byRarityThenElement)
			added.weapons = [...characterWeapons, ...others]
			if (characters.length) {
				const ordered = characterWeapons.map((id) => info(id).recruits)
				added.characters = [...ordered, ...characters.filter((id) => !ordered.includes(id))]
			}
		}
		for (const key of ['uncapped', 'transcended']) {
			entry[key]?.weapons?.sort(byElement)
		}
		entry.awakened?.sort(byElement)
	}
	if (toOrder.size) console.warn(`No entries with version: ${[...toOrder].join(', ')}`)
	writeFileSync(UPDATES, JSON.stringify(data, null, '\t') + '\n')
}

// --- Names -----------------------------------------------------------------

const ids = {
	characters: new Set(),
	styles: new Set(),
	weapons: new Set(),
	summons: new Set(),
	classes: new Set(),
	manatura: new Set(),
	shields: new Set(),
	raids: new Set()
}
for (const entry of entries) {
	for (const key of ['new', 'uncapped', 'transcended']) {
		for (const group of ['characters', 'styles', 'weapons', 'summons']) {
			for (const id of entry[key]?.[group] ?? []) ids[group].add(id)
		}
	}
	for (const id of entry.awakened ?? []) ids.weapons.add(id)
	for (const group of ['classes', 'manatura', 'shields', 'raids']) {
		for (const id of entry[group] ?? []) ids[group].add(id)
	}
}

const queries = {
	// Style shifts share a granblue_id with the base character; prefer the base row
	characters: `select distinct on (granblue_id) granblue_id, name_en, name_jp from characters
		where granblue_id in (${idList(ids.characters)}) order by granblue_id, style_swap`,
	styles: `select granblue_id, name_en || ' (' || style_name_en || ')',
		name_jp || '（' || coalesce(style_name_jp, style_name_en) || '）' from characters
		where style_swap and granblue_id in (${idList(ids.styles)})`,
	weapons: `select granblue_id, name_en, name_jp from weapons where granblue_id in (${idList(ids.weapons)})`,
	summons: `select granblue_id, name_en, name_jp from summons where granblue_id in (${idList(ids.summons)})`,
	classes: `select granblue_id, name_en, name_jp from jobs where granblue_id in (${idList(ids.classes)})`,
	manatura: `select granblue_id, trim(name_en), trim(name_jp) from job_accessories
		where accessory_type = 2 and granblue_id in (${idList(ids.manatura)})`,
	shields: `select granblue_id, trim(name_en), trim(name_jp) from job_accessories
		where accessory_type = 1 and granblue_id in (${idList(ids.shields)})`,
	raids: `select slug, name_en, name_jp from raids where slug in (${idList(ids.raids)})`
}

const names = {}
const missing = []
for (const [group, sql] of Object.entries(queries)) {
	const rows = new Map(query(sql).map(([id, en, ja]) => [id, { en, ja: ja || en }]))
	names[group] = Object.fromEntries([...rows].sort(([a], [b]) => a.localeCompare(b)))
	for (const id of ids[group]) if (!rows.has(id)) missing.push(`${group}:${id}`)
}
writeFileSync(NAMES, JSON.stringify(names, null, '\t') + '\n')

execFileSync(`${root}node_modules/.bin/prettier`, ['--write', UPDATES, NAMES], { stdio: 'ignore' })

const total = Object.values(names).reduce((sum, group) => sum + Object.keys(group).length, 0)
console.log(`updateNames.json: ${total} names`)
if (missing.length) {
	console.warn(`Not found in the catalogue (no name shown): ${missing.join(', ')}`)
	process.exitCode = 1
}
