import { describe, expect, it } from 'vitest'
import { apiPathFor } from '../apiPath'

describe('apiPathFor', () => {
	it.each([
		'http://localhost:3000',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:3002',
		'http://0.0.0.0:3000',
		'http://192.168.1.50:3000',
		'http://10.0.0.12:3000',
		'http://172.20.1.4:3000',
		'http://my-mac.local:3000',
		'http://api.localhost:3000',
		'http://[::1]:3000'
	])('uses /api/v1 for the development API at %s', (url) => {
		expect(apiPathFor(url)).toBe('/api/v1')
	})

	it.each([
		'https://api.granblue.team',
		'https://staging-api.granblue.team',
		'https://api.example.com',
		'https://teams.example.org:8443',
		'http://172.32.0.1:3000',
		'http://8.8.8.8'
	])('uses /v1 for the deployed API at %s', (url) => {
		expect(apiPathFor(url)).toBe('/v1')
	})

	it('falls back to /api/v1 when the URL is not valid', () => {
		expect(apiPathFor('not a url')).toBe('/api/v1')
	})
})
