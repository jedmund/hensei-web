import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { fetchCatalogue, readJson, runSimulation } from '../api'
import type { SimulationPayload } from '../pools'

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	})

const payload = { mode: 'premium', draws: '10' } as SimulationPayload

describe('readJson', () => {
	it('returns the body of a good response', async () => {
		await expect(readJson(json({ items: [] }))).resolves.toEqual({ items: [] })
	})

	it('passes on the API’s error message', async () => {
		await expect(readJson(json({ error: 'Too many draws' }, 422))).rejects.toThrow('Too many draws')
		await expect(readJson(json({ message: 'Bad pool' }, 400))).rejects.toThrow('Bad pool')
	})

	it('turns server errors and non-JSON into the generic error', async () => {
		const generic = await readJson(new Response('<html>')).catch((error) => error.message)
		expect(generic).toBeTruthy()
		await expect(readJson(json({ error: 'stack trace' }, 500))).rejects.toThrow(generic)
	})
})

describe('requests', () => {
	const fetchMock = vi.fn<typeof fetch>()

	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		fetchMock.mockReset()
		vi.unstubAllGlobals()
		vi.useRealTimers()
	})

	it('loads the live catalogue when a pinned banner is gone', async () => {
		fetchMock.mockResolvedValueOnce(json({}, 422)).mockResolvedValueOnce(json({ items: [] }))
		const onUnpinned = vi.fn()
		const response = await fetchCatalogue(
			{ mode: 'current' },
			'211960',
			new AbortController().signal,
			onUnpinned
		)
		expect(response.status).toBe(200)
		expect(onUnpinned).toHaveBeenCalledOnce()
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			'/api/gacha/catalogue?mode=current&banner=211960',
			'/api/gacha/catalogue?mode=current'
		])
	})

	it('hands an unpinned 422 back to the caller', async () => {
		fetchMock.mockResolvedValueOnce(json({}, 422))
		const onUnpinned = vi.fn()
		const response = await fetchCatalogue(
			{ mode: 'current' },
			'',
			new AbortController().signal,
			onUnpinned
		)
		expect(response.status).toBe(422)
		expect(onUnpinned).not.toHaveBeenCalled()
	})

	it('posts each operation to its endpoint', async () => {
		fetchMock.mockImplementation(async () => json({ seed: 'abc', draws: '10' }))
		const signal = new AbortController().signal
		await runSimulation('draw', payload, signal)
		await runSimulation('until', payload, signal)
		await runSimulation('odds', payload, signal)
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			'/api/gacha/simulations',
			'/api/gacha/until',
			'/api/gacha/odds'
		])
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			method: 'POST',
			body: JSON.stringify(payload)
		})
	})

	it('polls a queued run until it completes', async () => {
		vi.useFakeTimers()
		fetchMock
			.mockResolvedValueOnce(json({ token: 't1' }))
			.mockResolvedValueOnce(json({ status: 'running' }))
			.mockResolvedValueOnce(json({ status: 'complete', result: { seed: 's', draws: '10' } }))
		const run = runSimulation('draw', payload, new AbortController().signal)
		await vi.advanceTimersByTimeAsync(3000)
		await expect(run).resolves.toEqual({ seed: 's', draws: '10' })
		expect(fetchMock.mock.calls.slice(1).map(([url]) => url)).toEqual([
			'/api/gacha/jobs/t1',
			'/api/gacha/jobs/t1'
		])
	})

	it('fails when a queued run fails', async () => {
		vi.useFakeTimers()
		fetchMock
			.mockResolvedValueOnce(json({ token: 't1' }))
			.mockResolvedValueOnce(json({ status: 'failed', error: 'Worker died' }))
		const run = runSimulation('until', payload, new AbortController().signal)
		const outcome = expect(run).rejects.toThrow('Worker died')
		await vi.advanceTimersByTimeAsync(1500)
		await outcome
	})
})
