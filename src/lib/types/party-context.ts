/**
 * Party context types
 * Used for providing party data and operations to child components
 */

import type { Party } from '$lib/types/api/party'

export interface PartyContext {
	getParty: () => Party
	updateParty: (p: Party) => void
	canEdit: () => boolean
	getEditKey: () => string | undefined
	services: { gridService: any }
	openPicker?: (opts: {
		type: 'weapon' | 'summon' | 'character'
		position: number
		item?: any
	}) => void
}
