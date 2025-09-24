export interface AccountCookie {
	userId: string
	username: string
	token: string
	role: number
	expires_at?: string // ISO string of when the token expires
}
