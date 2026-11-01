/** What every form input receives */
import type { RecordForm } from '../recordForm.svelte'
import type { Field } from '../types'

export type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

// The registry boundary is untyped: each input reads its own record type
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface InputProps {
	field: Field<any, any>
	form: RecordForm<any, any>
	/** The record being edited, for what references show before they change */
	record: unknown
	/** Colours checkboxes and link buttons */
	element?: ElementName | undefined
}
/* eslint-enable @typescript-eslint/no-explicit-any */
