import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'
import { partyAdapter } from '$lib/api/adapters/party.adapter'

export const load: PageLoad = async ({ url, depends, fetch }) => {
	depends('app:parties:list')

	const pageParam = url.searchParams.get('page')
	const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

	try {
		const response = await partyAdapter.list({ page }, { fetch })

		return {
			items: response.results,
			page,
			total: response.total,
			totalPages: response.totalPages,
			perPage: response.perPage || 20
		}
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		const status = typeof err?.status === 'number' ? err.status : undefined
		const message = typeof err?.message === 'string' ? err.message : undefined
		console.error('[explore/+page.ts] Failed to load teams:', {
			error: e,
			message,
			status,
			stack: err?.stack,
			details: err?.details
		})
		const errorMessage = `Failed to load teams: ${message || 'Unknown error'}. Status: ${status || 'unknown'}`
		throw error(status || 502, errorMessage)
	}
}
