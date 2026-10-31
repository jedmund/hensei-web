// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				account: AccountCookie | null
				user: UserCookie | null
				isAuthenticated: boolean
			}
			auth: {
				accessToken: string
				user: UserCookie | null
				expiresAt: string
			} | null
		}
		// interface PageData {}
		interface PageState {
			/** The database record panel was opened from the list: closing it goes Back */
			recordPanel?: boolean
		}
		// interface Platform {}
	}
}

export {}
