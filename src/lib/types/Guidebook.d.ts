export interface Guidebook {
	id: string
	granblue_id: string
	name: {
		[key: string]: string
		en: string
		jp: string
	}
	description: {
		[key: string]: string
		en: string
		jp: string
	}
}
