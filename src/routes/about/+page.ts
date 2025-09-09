import { getJson } from '$lib/api'

export const load = async ({ fetch }) => {
	const status = await getJson<any>('/api/v1/version', fetch)
	return { status }
}
