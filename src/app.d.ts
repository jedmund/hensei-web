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
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
