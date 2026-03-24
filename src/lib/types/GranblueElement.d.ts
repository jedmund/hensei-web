export interface GranblueElement {
	[key: string]: unknown
	id: number
	weaknessId: number
	name: {
		en: string
		ja: string
	}
	slug: string
}
