/** Field lookups shared by the schema helpers */
import type { Field, FormMode, ResourceDef, Values } from './types'

/** `max_hp_flb` → `maxHpFlb`: the key as it appears on camelCased rows and records */
export function camelKey(key: string): string {
	return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** The camelCased property `key` names on a row or record */
export function prop(source: unknown, key: string): unknown {
	return (source as Record<string, unknown> | null | undefined)?.[camelKey(key)]
}

export function fieldFor<Row, Full>(def: ResourceDef<Row, Full>, key: string): Field<Row, Full> {
	const field = def.fields.find((f) => f.key === key)
	if (!field) throw new Error(`${def.name}: no field "${key}"`)
	return field
}

/** Writable fields on the given form, in definition order */
export function formFields<Row, Full>(
	def: ResourceDef<Row, Full>,
	mode: FormMode
): Field<Row, Full>[] {
	return def.fields.filter(
		(field) => field.write !== false && field.form !== false && field.form?.[mode] !== false
	)
}

/** Whether the field shows (and is validated and sent) for these values */
export function isShown(field: { when?: (values: Values) => boolean }, values: Values): boolean {
	return !field.when || field.when(values)
}
