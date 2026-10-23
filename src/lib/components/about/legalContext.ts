import { getContext, setContext } from 'svelte'

const KEY = Symbol('legal-document')

export interface LegalContext {
	/** Whether the full legal text is shown under each plain-language summary. */
	readonly showFull: boolean
}

export function setLegalContext(context: LegalContext) {
	setContext(KEY, context)
}

export function getLegalContext(): LegalContext {
	return getContext<LegalContext>(KEY) ?? { showFull: true }
}
