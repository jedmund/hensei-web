import { beforeAll, afterAll, afterEach } from 'vitest'

// Optional MSW setup to support future adapter tests without adding a hard dependency
let mockServer: { listen: (opts: Record<string, string>) => void; resetHandlers: () => void; close: () => void; use: (handler: unknown) => void } | null = null
let http: { post: (url: string, handler: () => unknown) => unknown } | null = null
let HttpResponse: { json: (body: unknown, opts: { status: number }) => unknown } | null = null

async function ensureMSW() {
	if (mockServer) return
	try {
		// @ts-expect-error - MSW is an optional dependency for testing
		const mswNode = await import('msw/node')
		// @ts-expect-error - MSW is an optional dependency for testing
		const msw = await import('msw')
		mockServer = mswNode.setupServer()
		http = msw.http
		HttpResponse = msw.HttpResponse
	} catch (e) {
		// MSW is not installed; skip server wiring
		mockServer = null
	}
}

beforeAll(async () => {
	await ensureMSW()
	if (mockServer) mockServer.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
	if (mockServer) mockServer.resetHandlers()
})
afterAll(() => {
	if (mockServer) mockServer.close()
})

// Helper to add mock handlers for POST endpoints under /api/v1
export function mockAPI(path: string, response: unknown, status = 200) {
	if (!mockServer || !http || !HttpResponse) return
	mockServer.use(
		http.post(`*/api/v1${path}`, () => {
			return HttpResponse.json(response, { status })
		})
	)
}
