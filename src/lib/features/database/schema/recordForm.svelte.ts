/**
 * A form's state, generated from its definition: values, derived values,
 * validation (including the server-side `save.asyncValidate` checks on
 * create), saving and the server's errors. It edits one record, or creates
 * one when there's no record.
 *
 * Create it during component init (it reads the query client from
 * context). Derived values are applied synchronously, on load (through
 * `fromRecord` or `initialValues`) and on each `set`, never in an effect, so
 * an unsaved-changes guard reset right after creating the form sees a clean
 * form.
 */
import { useQueryClient } from '@tanstack/svelte-query'
import type { z } from 'zod'
import { adminKeys } from '$lib/api/queries/admin.queries'
import type { AdminResource } from '$lib/types/api/admin'
import { fieldFor, isShown } from './fields'
import { applyDerive, fromRecord, initialValues, isEmpty, toPayload } from './form'
import type { Field, FormMode, ResourceDef, Values } from './types'
import {
	buildZod,
	fieldCheck,
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

/** How long typing pauses before a server-side check runs */
export const ASYNC_CHECK_DELAY = 400

export class RecordForm<Row = unknown, Full = unknown> {
	/** Form values by field key. Change them through `set`, so derived values follow */
	values: Values = $state({})
	/** Problems by field key, or a path into one (`name.en`) */
	errors: FieldErrors = $state({})
	/** Problems the fields can't show: other attributes, a failed request */
	formError: string | null = $state(null)
	saving = $state(false)
	/** Problems the `save.asyncValidate` checks found, by field key */
	asyncErrors: FieldErrors = $state({})

	readonly mode: FormMode
	readonly #def: ResourceDef<Row, Full>
	readonly #record: Full | null
	readonly #schema: z.ZodType<Values>
	readonly #queryClient = useQueryClient()
	/** Server-side checks by field key: debounce timers, and the checks in flight. Not state */
	readonly #timers: Record<string, ReturnType<typeof setTimeout>> = {}
	readonly #checks: Record<string, Promise<void>> = {}

	/** Edits `record`, or creates a record when it's null */
	constructor(def: ResourceDef<Row, Full>, record: Full | null) {
		this.#def = def
		this.#record = record
		this.mode = record === null ? 'create' : 'edit'
		this.#schema = buildZod(def, this.mode)
		this.values = record === null ? initialValues(def) : fromRecord(def, record)
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

		this.#scheduleCheck(key)
	}

	/** The field's server-side check on this form, if it has one */
	#asyncCheck(key: string) {
		if (this.mode !== 'create') return undefined
		return this.#def.save?.asyncValidate?.[key]
	}

	/** Restarts the field's server-side check, once typing pauses */
	#scheduleCheck(key: string) {
		if (!this.#asyncCheck(key)) return
		clearTimeout(this.#timers[key])
		delete this.#timers[key]
		delete this.asyncErrors[key]
		// A value failing its own rules says so on save; there's nothing to ask
		if (fieldCheck(fieldFor(this.#def, key)).check(this.values[key]).length) return
		this.#timers[key] = setTimeout(() => this.#runCheck(key), ASYNC_CHECK_DELAY)
	}

	#runCheck(key: string) {
		const check = this.#asyncCheck(key)!
		delete this.#timers[key]
		const value = $state.snapshot(this.values[key])
		const done: Promise<void> = check(value, $state.snapshot(this.values))
			.then((problem) => {
				// An answer for a value since changed is stale
				if (!same(this.values[key], value)) return
				if (problem) this.asyncErrors[key] = problem
				else delete this.asyncErrors[key]
			})
			.catch((error) => console.error(`Couldn't check ${key}:`, error))
			.finally(() => {
				if (this.#checks[key] === done) delete this.#checks[key]
			})
		this.#checks[key] = done
	}

	/** Runs the pending server-side checks now, and waits for every one in flight */
	async #settleChecks() {
		for (const [key, timer] of Object.entries(this.#timers)) {
			clearTimeout(timer)
			this.#runCheck(key)
		}
		await Promise.all(Object.values(this.#checks))
	}

	/** Whether the field shows for the current values */
	shown(field: Field<Row, Full>): boolean {
		return isShown(field, this.values)
	}

	/** The field's error, or the first one inside it */
	error(key: string): string | undefined {
		return fieldError(this.errors, key) ?? this.asyncErrors[key]
	}

	/**
	 * Checks the values, setting `errors`. True when they're valid and no
	 * server-side check found a problem
	 */
	validate(): boolean {
		const result = this.#schema.safeParse($state.snapshot(this.values), { error: issueMessage })
		this.errors = result.success ? {} : issueErrors(result.error.issues)
		return result.success && Object.keys(this.asyncErrors).length === 0
	}

	/**
	 * Validates and saves through the definition's `save.update` (or
	 * `save.create`, then `save.afterCreate` without waiting for it), then
	 * refreshes the record and the lists. Resolves with the saved record, or
	 * null when validation or the request failed (see `errors` and `formError`).
	 */
	async save(): Promise<Full | null> {
		const { create, update, afterCreate } = this.#def.save ?? {}
		const recordDef = this.#def.record
		const record = this.#record
		if (this.saving || !recordDef || !(record === null ? create : update)) return null

		this.formError = null
		this.saving = true
		try {
			// A quick Save mustn't get past a check still running
			await this.#settleChecks()
			if (!this.validate()) return null

			const payload = toPayload(this.#def, $state.snapshot(this.values), this.mode)
			const saved = record === null ? await create!(payload) : await update!(record, payload)
			if (record === null) afterCreate?.(saved).catch(console.error)

			const ids = [record, saved].flatMap((r) => (r === null ? [] : [recordDef.routeId(r)]))
			await Promise.all([
				...ids
					.filter((id, i) => ids.indexOf(id) === i)
					.map((id) =>
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
			const { fields, other } = serverErrors(this.#def, this.mode, error)
			this.errors = fields
			this.formError = other.length ? other.join('. ') : null
			return null
		} finally {
			this.saving = false
		}
	}
}

/** The edit form for a record, values loaded and derived; with no record, the create form */
export function createRecordForm<Row, Full>(
	def: ResourceDef<Row, Full>,
	record: Full | null = null
): RecordForm<Row, Full> {
	return new RecordForm(def, record)
}
