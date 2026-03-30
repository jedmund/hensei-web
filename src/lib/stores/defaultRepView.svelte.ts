import { setContext, getContext } from 'svelte'

const KEY = Symbol('defaultRepView')

interface DefaultRepViewBox {
	value: string
}

let _box: DefaultRepViewBox | undefined

export function setDefaultRepView(initial: string): void {
	const box = $state<DefaultRepViewBox>({ value: initial })
	_box = box
	setContext(KEY, box)
}

export function getDefaultRepView(): DefaultRepViewBox {
	return getContext<DefaultRepViewBox>(KEY) ?? { value: 'weapons' }
}

export function updateDefaultRepView(value: string): void {
	if (_box) _box.value = value
}
