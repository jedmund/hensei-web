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
}
