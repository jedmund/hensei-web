import { vi } from 'vitest'

/** Creates a mock fetch that returns the given data as JSON */
export function mockApiResponse(data: any) {
	return vi.fn().mockResolvedValue({
		ok: true,
		json: async () => data
	})
}

/**
 * Standard pagination meta matching Rails pagination_meta() output.
 * Rails returns { count, total_pages, per_page } from api_controller.rb.
 * Some controllers also include current_page.
 */
export function apiMeta(
	overrides?: Partial<{
		count: number
		total_pages: number
		per_page: number
		current_page: number
	}>
) {
	return {
		count: 1,
		total_pages: 1,
		per_page: 20,
		current_page: 1,
		...overrides
	}
}
