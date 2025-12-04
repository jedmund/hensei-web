export interface GridSummon {
	id: string
	main: boolean
	friend: boolean
	position: number
	object: Summon
	uncap_level: number
	quick_summon: boolean
	transcendence_step: number
	/** Reference to the source collection summon if linked */
	collectionSummonId?: string
	/** Whether the grid item is out of sync with its collection source */
	outOfSync?: boolean
}
