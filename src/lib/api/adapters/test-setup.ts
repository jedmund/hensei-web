import { beforeAll, afterAll, afterEach } from 'vitest'

// Optional MSW setup to support future adapter tests without adding a hard dependency
let mockServer: any = null
let http: any = null
let HttpResponse: any = null

async function ensureMSW() {
  if (mockServer) return
  try {
    const mswNode = await import('msw/node')
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
export function mockAPI(path: string, response: any, status = 200) {
  if (!mockServer || !http || !HttpResponse) return
  mockServer.use(
    http.post(`*/api/v1${path}`, () => {
      return HttpResponse.json(response, { status })
    })
  )
}
