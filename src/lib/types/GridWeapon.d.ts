export interface GridWeapon {
	id: string
	mainhand: boolean
	position: number
	object: Weapon
	uncap_level: number
	transcendence_step: number
	element: number
	weapon_keys?: Array<WeaponKey>
	ax?: Array<SimpleAxSkill>
	awakening?: {
		type: Awakening
		level: number
	}
	/** Reference to the source collection weapon if linked */
	collectionWeaponId?: string
	/** Whether the grid item is out of sync with its collection source */
	outOfSync?: boolean
}
