export interface JobAccessory {
	id: string
	granblue_id: string
	job: Job
	name: {
		[key: string]: string
		en: string
		ja: string
	}
	rarity: number
}
