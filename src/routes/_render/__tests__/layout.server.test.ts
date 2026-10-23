import { afterEach, describe, expect, it, vi } from 'vitest'

const privateEnv = vi.hoisted(() => ({
	RENDER_INTERNAL_SECRET: 'render-secret' as string | undefined
}))
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }))

import { load } from '../+layout.server'

type LoadEvent = Parameters<typeof load>[0]

const run = (secret?: string, clientAddress = '203.0.113.9') =>
	load({
		request: new Request('http://localhost/_render/user', {
			headers: secret === undefined ? {} : { 'x-render-secret': secret }
		}),
		getClientAddress: () => clientAddress
	} as unknown as LoadEvent)

describe('_render layout guard', () => {
	afterEach(() => {
		privateEnv.RENDER_INTERNAL_SECRET = 'render-secret'
	})

	it('accepts the configured secret', async () => {
		await expect(run('render-secret')).resolves.toEqual({})
	})

	it.each([undefined, '', 'render-secreT', 'render-secret-longer', 'short'])(
		'returns 404 for %j',
		async (secret) => {
			await expect(run(secret)).rejects.toMatchObject({ status: 404 })
		}
	)

	it('fails closed when no secret is configured', async () => {
		privateEnv.RENDER_INTERNAL_SECRET = undefined
		await expect(run('render-secret')).rejects.toMatchObject({ status: 404 })
	})
})
