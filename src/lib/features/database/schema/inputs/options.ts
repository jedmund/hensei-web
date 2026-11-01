/** Select options for an enum field, with their labels in the current locale */
import { getElementLabel } from '$lib/utils/element'
import type { Field, Values } from '../types'
import type { ElementName } from './types'

export interface SelectOption {
	value: string | number
	label: string
}

export function optionsFor<Row, Full>(field: Field<Row, Full>): SelectOption[] {
	if (field.kind !== 'enum' && field.kind !== 'enumList') return []
	return field.options().map(({ value, label }) => ({
		value,
		label: typeof label === 'function' ? label() : label
	}))
}

/** The element a form's checkboxes and buttons follow, from its `element` value */
export function formElement(values: Values): ElementName | undefined {
	const element = values.element as number | null | undefined
	return getElementLabel(element ?? undefined).toLowerCase() as ElementName | undefined
}
