export interface GridCharacter {
	id: string
	position: number
	object: Character
	uncap_level: number
	transcendence_step: number
	perpetuity: boolean
	over_mastery: ExtendedMastery[]
	aetherial_mastery?: ExtendedMastery
	awakening: {
		type: Awakening
		level: number
	}
	/** Reference to the source collection character if linked */
	collectionCharacterId?: string
	/** Whether the grid item is out of sync with its collection source */
	outOfSync?: boolean
}
