export interface AccountCookie {
	userId: string
	username: string
	token: string
	role: number
	expires_at?: string // ISO string of when the token expires
	/** When the account is scheduled to be deleted (ISO string), if it is. */
	deletionScheduledAt?: string | null
}
