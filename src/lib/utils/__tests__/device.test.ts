import { describe, expect, it } from 'vitest'
import { isMobileRequest } from '../device'

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID_PHONE =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const ANDROID_TABLET =
	'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
// iPadOS Safari reports itself as desktop Safari on macOS
const IPAD =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const DESKTOP_CHROME =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

function request(headers: Record<string, string>) {
	return new Headers(headers)
}

describe('isMobileRequest', () => {
	it('trusts Sec-CH-UA-Mobile when present', () => {
		expect(
			isMobileRequest(request({ 'sec-ch-ua-mobile': '?1', 'user-agent': DESKTOP_CHROME }))
		).toBe(true)
		expect(isMobileRequest(request({ 'sec-ch-ua-mobile': '?0', 'user-agent': IPHONE }))).toBe(false)
	})

	it('falls back to the user agent for phones', () => {
		expect(isMobileRequest(request({ 'user-agent': IPHONE }))).toBe(true)
		expect(isMobileRequest(request({ 'user-agent': ANDROID_PHONE }))).toBe(true)
	})

	it('treats tablets and desktops as not mobile', () => {
		expect(isMobileRequest(request({ 'user-agent': ANDROID_TABLET }))).toBe(false)
		expect(isMobileRequest(request({ 'user-agent': IPAD }))).toBe(false)
		expect(isMobileRequest(request({ 'user-agent': DESKTOP_CHROME }))).toBe(false)
	})

	it('is false without any signal', () => {
		expect(isMobileRequest(request({}))).toBe(false)
	})
})
