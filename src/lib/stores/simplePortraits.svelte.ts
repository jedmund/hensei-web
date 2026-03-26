import { setContext, getContext } from 'svelte'

const KEY = Symbol('simplePortraits')

interface SimplePortraitsBox {
	value: boolean
}

let _box: SimplePortraitsBox | undefined

export function setSimplePortraits(initial: boolean): void {
	const box = $state<SimplePortraitsBox>({ value: initial })
	_box = box
	setContext(KEY, box)
}

export function getSimplePortraits(): SimplePortraitsBox {
	return getContext<SimplePortraitsBox>(KEY) ?? { value: false }
}

export function updateSimplePortraits(value: boolean): void {
	if (_box) _box.value = value
}
