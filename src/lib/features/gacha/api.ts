/**
 * Requests the simulator makes through the same-origin `/api/gacha` proxy:
 * the pool's catalogue, and a draw, which long runs answer with a job to
 * poll.
 */

import * as m from '$lib/paraglide/messages'
import type { GachaOperation } from '$lib/utils/gachaShare'
import type { GachaResult } from '$lib/types/gacha'
import type { SimulationPayload } from './pools'

const POLL_INTERVAL = 1500
const POLL_TIMEOUT = 10 * 60_000

/** Parse a proxy response, turning non-JSON or failed responses into readable errors */
export async function readJson(response: Response) {
	const isJson = response.headers.get('Content-Type')?.includes('application/json')
	const data = isJson ? await response.json().catch(() => null) : null
	if (!data || response.status >= 500) throw new Error(m.gacha_error())
	if (!response.ok) throw new Error(data.error || data.message || m.gacha_error())
	return data
}

/**
 * The catalogue for a pool. A shared banner we no longer have answers 422:
 * the result can't replay, so `onUnpinned` runs and the live banner loads
 * instead.
 */
export function fetchCatalogue(
	settings: Record<string, string>,
	pinned: string,
	signal: AbortSignal,
	onUnpinned: () => void
): Promise<Response> {
	const query = new URLSearchParams(pinned ? { ...settings, banner: pinned } : settings)
	return fetch(`/api/gacha/catalogue?${query}`, { signal }).then((response) => {
		if (response.status !== 422 || !pinned) return response
		onUnpinned()
		return fetchCatalogue(settings, '', signal, onUnpinned)
	})
}

/** Runs a Draw, Until or Odds request, waiting on its job when the API queues one */
export async function runSimulation(
	operation: GachaOperation,
	payload: SimulationPayload,
	signal: AbortSignal
): Promise<GachaResult> {
	let response = await fetch(`/api/gacha/${operation === 'draw' ? 'simulations' : operation}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
		signal
	})
	let data = await readJson(response)
	if (data.token) {
		const token = data.token
		const deadline = Date.now() + POLL_TIMEOUT
		while (Date.now() < deadline) {
			await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
			response = await fetch(`/api/gacha/jobs/${token}`, { signal })
			data = await readJson(response)
			if (data.status === 'failed') throw new Error(data.error || m.gacha_error())
			if (data.status === 'complete') {
				data = data.result
				break
			}
		}
		if (!data.draws) throw new Error(m.gacha_error())
	}
	return data
}
