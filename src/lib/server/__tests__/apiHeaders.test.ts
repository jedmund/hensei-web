import { describe, expect, it } from 'vitest'
import { withApiHeaders } from '../apiHeaders'

const API_URL = 'https://api.example.test/v1/parties'

describe('withApiHeaders', () => {
	it('returns the request untouched with no token or secret', () => {
		const request = new Request(API_URL)
		expect(withApiHeaders(request, { visitorIp: '203.0.113.9' })).toBe(request)
	})

	it('adds the bearer token', () => {
		const result = withApiHeaders(new Request(API_URL), { token: 'abc', visitorIp: null })
		expect(result.headers.get('authorization')).toBe('Bearer abc')
		expect(result.headers.get('x-internal-secret')).toBeNull()
	})

	it('adds the internal secret and visitor IP when configured', () => {
		const result = withApiHeaders(new Request(API_URL), {
			internalSecret: 's3cret',
			visitorIp: '203.0.113.9'
		})
		expect(result.headers.get('x-internal-secret')).toBe('s3cret')
		expect(result.headers.get('x-client-ip')).toBe('203.0.113.9')
	})

	it('drops a client IP header when the visitor IP is unknown', () => {
		const request = new Request(API_URL, { headers: { 'x-client-ip': '6.6.6.6' } })
		const result = withApiHeaders(request, { internalSecret: 's3cret', visitorIp: null })
		expect(result.headers.get('x-client-ip')).toBeNull()
	})

	it('preserves existing headers and the request body', async () => {
		const request = new Request(API_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{"a":1}'
		})
		const result = withApiHeaders(request, { token: 'abc', visitorIp: null })
		expect(result.method).toBe('POST')
		expect(result.headers.get('content-type')).toBe('application/json')
		expect(await result.text()).toBe('{"a":1}')
	})
})
