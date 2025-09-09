export interface User {
	id: string
	username: string
	granblueId: string
	avatar: {
		picture: string
		element: string
	}
	gender: number
	role: number
}
