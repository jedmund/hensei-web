export interface User {
	id: string
	username: string
	displayName?: string | null
	granblueId: string
	wikiProfile?: string
	avatar: {
		picture: string
		element: string
	}
	gender: number
	role: number
}
