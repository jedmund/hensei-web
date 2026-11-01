/**
 * The edit form's state for one record, generated from its definition:
 * values, derived values, validation, saving and the server's errors.
 *
 * Create it during component init (it reads the query client from
 * context). Derived values are applied synchronously, on load (through
 * `fromRecord`) and on each `set`, never in an effect, so an unsaved-changes
 * guard reset right after creating the form sees a clean form.
 */
import { useQueryClient } from '@tanstack/svelte-query'
import type { z } from 'zod'
import { adminKeys } from '$lib/api/queries/admin.queries'
import type { AdminResource } from '$lib/types/api/admin'
import { isShown } from './fields'
import { applyDerive, fromRecord, isEmpty, toPayload } from './form'
import type { Field, ResourceDef, Values } from './types'
import {
	buildZod,
	fieldError,
	issueErrors,
	issueMessage,
	serverErrors,
	type FieldErrors
} from './validation'

/** Values that send the same thing: equal, or both blank ('' and null alike) */
function same(a: unknown, b: unknown): boolean {
	if (isEmpty(a) && isEmpty(b)) return true
	return JSON.stringify(a) === JSON.stringify(b)
}

export class RecordForm<Row = unknown, Full = unknown> {
	/** Form values by field key. Change them through `set`, so derived values follow */
	values: Values = $state({})
	/** Problems by field key, or a path into one (`name.en`) */
	errors: FieldErrors = $state({})
	/** Problems the fields can't show: other attributes, a failed request */
	formError: string | null = $state(null)
	saving = $state(false)

	readonly #def: ResourceDef<Row, Full>
	readonly #record: Full
	readonly #schema: z.ZodType<Values>
	readonly #queryClient = useQueryClient()

	constructor(def: ResourceDef<Row, Full>, record: Full) {
		this.#def = def
		this.#record = record
		this.#schema = buildZod(def, 'edit')
		this.values = fromRecord(def, record)
	}

	/** Sets a field's value and applies the derived values that follow from it */
	set(key: string, value: unknown) {
		// Inputs echo their value back (and some turn '' into null) when they
		// mount: that isn't an edit, and mustn't trigger derive rules
		if (same(this.values[key], value)) return

		const next = applyDerive(this.#def, { ...$state.snapshot(this.values), [key]: value }, key)
		// Only the keys that changed, so untouched inputs don't redraw
		for (const [k, v] of Object.entries(next)) {
			if (JSON.stringify(this.values[k]) !== JSON.stringify(v)) this.values[k] = v
		}

		const stale = Object.keys(this.errors).filter((p) => p === key || p.startsWith(`${key}.`))
		for (const path of stale) delete this.errors[path]
	}

	/** Whether the field shows for the current values */
	shown(field: Field<Row, Full>): boolean {
		return isShown(field, this.values)
	}

	/** The field's error, or the first one inside it */
	error(key: string): string | undefined {
		return fieldError(this.errors, key)
	}

	/** Checks the values, setting `errors`. True when they're valid */
	validate(): boolean {
		const result = this.#schema.safeParse($state.snapshot(this.values), { error: issueMessage })
		this.errors = result.success ? {} : issueErrors(result.error.issues)
		return result.success
	}

	/**
	 * Validates and saves through the definition's `save.update`, then
	 * refreshes the record and the lists. Resolves with the saved record, or
	 * null when validation or the request failed (see `errors` and `formError`).
	 */
	async save(): Promise<Full | null> {
		const update = this.#def.save?.update
		const recordDef = this.#def.record
		if (!update || !recordDef || this.saving) return null

		this.formError = null
		if (!this.validate()) return null

		this.saving = true
		try {
			const payload = toPayload(this.#def, $state.snapshot(this.values), 'edit')
			const saved = await update(this.#record, payload)
			const before = recordDef.routeId(this.#record)
			const after = recordDef.routeId(saved)
			await Promise.all([
				...(before === after ? [before] : [before, after]).map((id) =>
					this.#queryClient.invalidateQueries({
						queryKey: recordDef.query(id).queryKey,
						refetchType: 'all'
					})
				),
				this.#queryClient.invalidateQueries({
					queryKey: adminKeys.lists(this.#def.name as AdminResource)
				})
			])
			return saved
		} catch (error) {
			const { fields, other } = serverErrors(this.#def, 'edit', error)
			this.errors = fields
			this.formError = other.length ? other.join('. ') : null
			return null
		} finally {
			this.saving = false
		}
	}
}

/** The edit form for a record, values loaded and derived */
export function createRecordForm<Row, Full>(
	def: ResourceDef<Row, Full>,
	record: Full
): RecordForm<Row, Full> {
	return new RecordForm(def, record)
}
