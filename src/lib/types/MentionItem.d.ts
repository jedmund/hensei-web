export interface MentionItem {
	name: {
		[key: string]: string
		en: string
		ja: string
	}
	type: string
	granblue_id: string
	element: GranblueElement
}
