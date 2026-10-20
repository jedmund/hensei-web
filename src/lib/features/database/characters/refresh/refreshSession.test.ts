import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CharacterRefreshAdapter } from '$lib/api/adapters/characterRefresh.adapter'
import { API } from '$lib/api/adapters/__tests__/fixtures/characterRefresh.fixtures'
import type { CharacterTypeaheadOption } from '$lib/components/ui/characterTypeahead'

const { CharacterRefreshSession, BatchRefreshSession } = await import('./refreshSession.svelte')

const BASE = 'https://api.example.com'
const ID = '0b6f1d2e-0000-4000-8000-000000000001'

type Reply = { ok: true; body: unknown } | { ok: false; status: number; body: unknown }

/** Queues fetch replies in order; returns the mock for call assertions. */
function replies(...queue: Reply[]) {
	const fetch = vi.fn()
	for (const r of queue) {
		fetch.mockResolvedValueOnce(
			r.ok
				? { ok: true, status: 200, json: async () => r.body }
				: { ok: false, status: r.status, statusText: 'Error', json: async () => r.body }
		)
	}
	global.fetch = fetch
	return fetch
}

const ok = (body: unknown): Reply => ({ ok: true, body })
const fail = (status: number, body: unknown = {}): Reply => ({ ok: false, status, body })

function bodyOf(fetch: ReturnType<typeof vi.fn>, call: number) {
	return JSON.parse((fetch.mock.calls[call]![1] as RequestInit).body as string)
}

let adapter: CharacterRefreshAdapter
let originalFetch: typeof global.fetch

beforeEach(() => {
	originalFetch = global.fetch
	adapter = new CharacterRefreshAdapter({ baseURL: BASE })
})

afterEach(() => {
	global.fetch = originalFetch
})

describe('CharacterRefreshSession', () => {
	it('is previewing while the request runs', async () => {
		replies(ok(API.reparsePreviewChanges))
		const session = new CharacterRefreshSession(ID, adapter)

		const pending = session.preview()
		expect(session.phase).toBe('previewing')
		expect(session.busy).toBe(true)
		await pending
		expect(session.phase).toBe('previewed')
	})

	it('sends the Japanese wiki option', async () => {
		const fetch = replies(ok(API.reparsePreviewChanges))
		const session = new CharacterRefreshSession(ID, adapter)
		session.includeJp = true

		await session.preview()

		expect(bodyOf(fetch, 0)).toMatchObject({ refetch: true, refetch_jp: true, preview: true })
	})

	it('shows changes and offers apply', async () => {
		replies(ok(API.reparsePreviewChanges))
		const session = new CharacterRefreshSession(ID, adapter)

		await session.preview()

		expect(session.outcome).toBe('changes')
		expect(session.result?.changes).toHaveLength(4)
		expect(session.canApply).toBe(true)
	})

	it('offers no apply when nothing changed', async () => {
		replies(ok(API.reparsePreviewNoChanges))
		const session = new CharacterRefreshSession(ID, adapter)

		await session.preview()

		expect(session.outcome).toBe('none')
		expect(session.canApply).toBe(false)
		expect(await session.apply()).toBeNull()
	})

	it('applies with the preview token and returns the written character', async () => {
		const fetch = replies(
			ok(API.reparsePreviewChanges),
			ok({ ...API.reparseApplied, character: { id: ID, granblue_id: '3040377000' } })
		)
		const session = new CharacterRefreshSession(ID, adapter)
		await session.preview()

		const pending = session.apply()
		expect(session.phase).toBe('applying')
		const response = await pending

		expect(bodyOf(fetch, 1)).toEqual({
			refetch: false,
			refetch_jp: false,
			preview: false,
			preview_token: 'pv_8f2c1d0e4b7a'
		})
		expect(session.phase).toBe('applied')
		expect(response?.refresh.written).toBe(true)
		expect(response?.character).toMatchObject({ granblueId: '3040377000' })
	})

	it('drops the preview when the token expired, and previews again', async () => {
		const fetch = replies(
			ok(API.reparsePreviewChanges),
			fail(422, API.reparseExpiredToken.body),
			ok(API.reparsePreviewNoChanges)
		)
		const session = new CharacterRefreshSession(ID, adapter)
		await session.preview()

		expect(await session.apply()).toBeNull()
		expect(session.phase).toBe('failed')
		expect(session.failure).toBe('preview_expired')
		expect(session.result).toBeNull()
		expect(session.canApply).toBe(false)

		await session.preview()
		expect(session.phase).toBe('previewed')
		expect(session.failure).toBeNull()
		expect(bodyOf(fetch, 2)).toMatchObject({ preview: true })
	})

	it('keeps the preview after another apply failure so apply can be retried', async () => {
		replies(ok(API.reparsePreviewChanges), fail(500, { error: 'Boom' }))
		const session = new CharacterRefreshSession(ID, adapter)
		await session.preview()

		await session.apply()

		expect(session.failure).toBe('other')
		expect(session.failureDetail).toBe('Boom')
		expect(session.result).not.toBeNull()
		expect(session.canApply).toBe(true)
	})

	it('reports a non-editor (401)', async () => {
		replies(fail(401, { error: 'Unauthorized' }))
		const session = new CharacterRefreshSession(ID, adapter)

		await session.preview()

		expect(session.phase).toBe('failed')
		expect(session.failure).toBe('unauthorized')
	})

	it("shows a build refusal's message", async () => {
		const refusal = 'The build made no skills for this character.'
		replies(fail(422, { error: refusal, message: refusal }))
		const session = new CharacterRefreshSession(ID, adapter)

		await session.preview()

		expect(session.failure).toBe('other')
		expect(session.failureDetail).toBe(refusal)
	})

	it('ignores a preview that finishes after reset', async () => {
		replies(ok(API.reparsePreviewChanges))
		const session = new CharacterRefreshSession(ID, adapter)

		const pending = session.preview()
		session.reset()
		await pending

		expect(session.phase).toBe('idle')
		expect(session.result).toBeNull()
	})
})

describe('BatchRefreshSession', () => {
	const pick = (id: string, styleSwap = false): CharacterTypeaheadOption => ({
		id,
		label: id,
		granblueId: '3040377000',
		styleSwap
	})

	/** A schedule that runs polls only when the test says so */
	function manualSchedule() {
		const pending: (() => void)[] = []
		return {
			schedule: (fn: () => void) => {
				pending.push(fn)
				return () => {
					const i = pending.indexOf(fn)
					if (i >= 0) pending.splice(i, 1)
				}
			},
			get count() {
				return pending.length
			},
			async tick() {
				const fn = pending.shift()
				fn?.()
				await vi.waitFor(() => Promise.resolve())
				await new Promise((r) => setTimeout(r, 0))
			}
		}
	}

	it('picks rows, style rows included, without duplicates', () => {
		const session = new BatchRefreshSession(adapter)
		expect(session.add(pick('base'))).toBe(true)
		expect(session.add(pick('style', true))).toBe(true)
		expect(session.add(pick('base'))).toBe(false)
		expect(session.picks.map((p) => p.id)).toEqual(['base', 'style'])

		session.remove('base')
		expect(session.picks.map((p) => p.id)).toEqual(['style'])
	})

	it('stops at 20 characters', () => {
		const session = new BatchRefreshSession(adapter)
		for (let i = 0; i < 20; i++) session.add(pick(`c${i}`))
		expect(session.isFull).toBe(true)
		expect(session.add(pick('c20'))).toBe(false)
		expect(session.picks).toHaveLength(20)
	})

	it('runs, polls every interval and lands on previewed with changed items ticked', async () => {
		const timer = manualSchedule()
		const fetch = replies(ok(API.batchCreated.body), ok(API.batchRunning), ok(API.batchPreviewed))
		const session = new BatchRefreshSession(adapter, { schedule: timer.schedule })
		session.add(pick('0b6f1d2e-0000-4000-8000-000000000001'))
		session.includeJp = true

		await session.start()

		expect(bodyOf(fetch, 0)).toEqual({
			character_ids: ['0b6f1d2e-0000-4000-8000-000000000001'],
			refetch_jp: true
		})
		expect(session.phase).toBe('running')
		expect(session.progress).toEqual({ done: 1, total: 3 })
		expect(timer.count).toBe(1)

		await timer.tick()

		expect(session.phase).toBe('previewed')
		expect(timer.count).toBe(0)
		expect(session.selected).toEqual(['0b6f1d2e-0000-4000-8000-000000000001'])
	})

	it('lets the editor untick and tick previewed items, but not failed ones', async () => {
		replies(ok(API.batchCreated.body), ok(API.batchPreviewed))
		const session = new BatchRefreshSession(adapter, { schedule: manualSchedule().schedule })
		session.add(pick('x'))
		await session.start()

		session.toggle('0b6f1d2e-0000-4000-8000-000000000001', false)
		expect(session.canApply).toBe(false)
		session.toggle('0b6f1d2e-0000-4000-8000-000000000002', true)
		session.toggle('0b6f1d2e-0000-4000-8000-000000000003', true)
		expect(session.selected).toEqual(['0b6f1d2e-0000-4000-8000-000000000002'])
		expect(session.canApply).toBe(true)
	})

	it('applies the selected items and polls until applied', async () => {
		const timer = manualSchedule()
		const onApplied = vi.fn()
		const fetch = replies(
			ok(API.batchCreated.body),
			ok(API.batchPreviewed),
			ok({}),
			// The job hasn't picked the apply up yet: still reads previewed.
			ok(API.batchPreviewed),
			ok(API.batchApplied)
		)
		const session = new BatchRefreshSession(adapter, { schedule: timer.schedule, onApplied })
		session.add(pick('x'))
		await session.start()

		await session.apply()

		expect(bodyOf(fetch, 2)).toEqual({ character_ids: ['0b6f1d2e-0000-4000-8000-000000000001'] })
		expect(session.phase).toBe('applying')

		await timer.tick()
		expect(session.phase).toBe('applying')
		expect(session.canApply).toBe(false)

		await timer.tick()
		expect(session.phase).toBe('applied')
		expect(timer.count).toBe(0)
		expect(onApplied).toHaveBeenCalledWith(1)
		expect(session.batch?.items.map((i) => i.status)).toEqual(['applied', 'skipped', 'failed'])
	})

	it('shows where the refresh is when apply gets 409 not_previewed', async () => {
		replies(
			ok(API.batchCreated.body),
			ok(API.batchPreviewed),
			fail(409, { error: 'not_previewed' }),
			ok(API.batchApplied)
		)
		const session = new BatchRefreshSession(adapter, { schedule: manualSchedule().schedule })
		session.add(pick('x'))
		await session.start()

		await session.apply()
		await new Promise((r) => setTimeout(r, 0))

		expect(session.failure).toBe('not_previewed')
		expect(session.phase).toBe('applied')
		expect(session.canApply).toBe(false)
	})

	it('reports invalid characters and stays on the picker', async () => {
		replies(fail(422, { error: 'invalid_characters', message: 'No such ids' }))
		const session = new BatchRefreshSession(adapter)
		session.add(pick('x'))

		await session.start()

		expect(session.failure).toBe('invalid_characters')
		expect(session.phase).toBe('picking')
	})

	it('reports a failed refresh', async () => {
		replies(ok(API.batchCreated.body), ok({ ...API.batchRunning, status: 'failed' }))
		const session = new BatchRefreshSession(adapter, { schedule: manualSchedule().schedule })
		session.add(pick('x'))

		await session.start()

		expect(session.phase).toBe('failed')
	})

	it('shows the rate limit and stays on the picker', async () => {
		replies(fail(429, { error: 'Rate limit exceeded' }))
		const session = new BatchRefreshSession(adapter)
		session.add(pick('x'))

		await session.start()

		expect(session.failure).toBe('rate_limited')
		expect(session.phase).toBe('picking')
		expect(session.canStart).toBe(true)
	})

	it('stops polling on an error and resumes on request', async () => {
		const timer = manualSchedule()
		replies(
			ok(API.batchCreated.body),
			ok(API.batchRunning),
			fail(404, { error: 'Not found' }),
			ok(API.batchPreviewed)
		)
		const session = new BatchRefreshSession(adapter, { schedule: timer.schedule })
		session.add(pick('x'))
		await session.start()

		await timer.tick()
		expect(session.pollStopped).toBe(true)
		expect(session.failure).toBe('not_found')
		expect(timer.count).toBe(0)

		session.resume()
		await new Promise((r) => setTimeout(r, 0))
		expect(session.phase).toBe('previewed')
		expect(session.failure).toBeNull()
	})

	it('stays on the refresh when its first poll fails, and resumes it', async () => {
		const timer = manualSchedule()
		const fetch = replies(
			ok(API.batchCreated.body),
			// Not retried by the adapter (a 5xx would be, on a GET)
			fail(403, { error: 'Forbidden' }),
			ok(API.batchPreviewed)
		)
		const session = new BatchRefreshSession(adapter, { schedule: timer.schedule })
		session.add(pick('x'))

		await session.start()

		expect(session.refreshId).toBe('rf_3c4d5e6f7a8b')
		expect(session.batch).toBeNull()
		expect(session.phase).toBe('running')
		expect(session.pollStopped).toBe(true)
		// No second refresh against the rate limit
		expect(session.canStart).toBe(false)

		session.resume()
		await new Promise((r) => setTimeout(r, 0))
		expect(session.phase).toBe('previewed')
		expect(session.canStart).toBe(false)
		expect(fetch).toHaveBeenCalledTimes(3)
	})

	it('stops polling once disposed', async () => {
		const timer = manualSchedule()
		replies(ok(API.batchCreated.body), ok(API.batchRunning))
		const session = new BatchRefreshSession(adapter, { schedule: timer.schedule })
		session.add(pick('x'))
		await session.start()
		expect(timer.count).toBe(1)

		session.dispose()

		expect(timer.count).toBe(0)
	})
})
