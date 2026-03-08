/**
 * Party context types
 * Used for providing party data and operations to child components
 */

import type { Party } from '$lib/types/api/party'
import type { GridType } from '$lib/types/enums'
import { getContext, setContext } from 'svelte'

export interface PartyContext {
	getParty: () => Party
	updateParty: (p: Party) => void
	canEdit: () => boolean
	getEditKey: () => string | null | undefined
	getSelectedSlot?: () => number | null
	getActiveTab?: () => GridType
	services: { gridService: any; partyService?: any }
	openPicker?: (opts: {
		type: 'weapon' | 'summon' | 'character'
		position: number
		item?: any
	}) => void
}

const PARTY_CONTEXT_KEY = Symbol('party')

export function setPartyContext(value: PartyContext) {
	setContext(PARTY_CONTEXT_KEY, value)
}

export function usePartyContext(): PartyContext {
	const ctx = getContext<PartyContext | undefined>(PARTY_CONTEXT_KEY)
	if (!ctx) throw new Error('usePartyContext must be used within a Party provider')
	return ctx
}
