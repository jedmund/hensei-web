import { PUBLIC_SIERO_API_URL } from '$env/static/public'

export const load = async ({ fetch }) => {
	const apiBase = PUBLIC_SIERO_API_URL || 'http://localhost:3000'
	const response = await fetch(`${apiBase}/api/v1/version`)
	const status = await response.json()
	return { status }
}
