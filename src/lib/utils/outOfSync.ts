/**
 * Helpers for working with the `outOfSyncFields` list returned by the API.
 *
 * The backend emits camelCase field keys, with relational sets flattened
 * as dotted keys: e.g. ['uncapLevel', 'overMastery.1', 'bullets.0',
 * 'weaponKey2', 'ax.1'].
 *
 * Sections that map to a single backend field use `hasField`. Sections that
 * map to a list (rings, bullets, AX) check per-row drift with `hasRow`.
 */

export type OutOfSyncFields = string[] | undefined | null

/** True when the section that owns `key` has drifted. */
export function hasField(fields: OutOfSyncFields, key: string): boolean {
	if (!fields || fields.length === 0) return false
	return fields.includes(key)
}

/** True when any field in `keys` has drifted. */
export function hasAnyField(fields: OutOfSyncFields, keys: readonly string[]): boolean {
	if (!fields || fields.length === 0) return false
	return keys.some((key) => fields.includes(key))
}

/**
 * True when a specific row in a relational set has drifted.
 *
 * @example hasRow(fields, 'bullets', 0) // matches 'bullets.0'
 * @example hasRow(fields, 'overMastery', 1) // matches 'overMastery.1'
 */
export function hasRow(fields: OutOfSyncFields, prefix: string, index: number): boolean {
	if (!fields || fields.length === 0) return false
	return fields.includes(`${prefix}.${index}`)
}

/**
 * True when any row in a relational set has drifted.
 *
 * @example hasAnyRow(fields, 'bullets') // true if 'bullets.0' or 'bullets.N' present
 */
export function hasAnyRow(fields: OutOfSyncFields, prefix: string): boolean {
	if (!fields || fields.length === 0) return false
	const dotted = `${prefix}.`
	return fields.some((field) => field.startsWith(dotted))
}
