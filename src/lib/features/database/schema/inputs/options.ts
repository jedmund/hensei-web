/** Select options for an enum field, with their labels in the current locale */
import type { Field } from '../types'

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
