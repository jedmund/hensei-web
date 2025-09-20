import { OAUTH_BASE } from '$lib/config'

export interface OAuthLoginResponse {
	access_token: string
	token_type: 'Bearer'
	expires_in: number
	refresh_token: string
	created_at: number
	user: {
		id: string
		username: string
		role: number
	}
}

export async function passwordGrantLogin(
	fetchFn: typeof fetch,
	body: { email: string; password: string; grant_type: 'password' }
): Promise<OAuthLoginResponse> {
	const url = `${OAUTH_BASE}/token`
	const res = await fetchFn(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})

	if (res.status === 401) throw new Error('unauthorized')
	if (!res.ok) throw new Error(`oauth_error_${res.status}`)
	return res.json() as Promise<OAuthLoginResponse>
}
