import { describe, expect, it } from 'vitest'
import { isLikelyBot, isPrefetch, shouldRecordView } from '../partyViews'

const PARTY_ID = '0f8c6f3e-2b1a-4c5d-9e7f-1a2b3c4d5e6f'
const CHROME =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

function viewRequest(headers: Record<string, string> = {}) {
	return new Request(`https://granblue.team/api/teams/${PARTY_ID}/view`, {
		method: 'POST',
		headers: { 'user-agent': CHROME, ...headers }
	})
}

describe('isLikelyBot', () => {
	it.each([
		'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
		'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
		'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
		'Twitterbot/1.0',
		'facebookexternalhit/1.1',
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0 Safari/537.36',
		'curl/8.4.0',
		'python-requests/2.32.0',
		'node-fetch/1.0'
	])('flags %s', (ua) => {
		expect(isLikelyBot(ua)).toBe(true)
	})

	it('flags a missing user agent', () => {
		expect(isLikelyBot(null)).toBe(true)
		expect(isLikelyBot('')).toBe(true)
	})

	it.each([CHROME, IPHONE])('lets browsers through: %s', (ua) => {
		expect(isLikelyBot(ua)).toBe(false)
	})
})

describe('isPrefetch', () => {
	it('detects Sec-Purpose and Purpose prefetches', () => {
		expect(isPrefetch(viewRequest({ 'sec-purpose': 'prefetch' }))).toBe(true)
		expect(isPrefetch(viewRequest({ 'sec-purpose': 'prefetch;prerender' }))).toBe(true)
		expect(isPrefetch(viewRequest({ purpose: 'prefetch' }))).toBe(true)
		expect(isPrefetch(viewRequest())).toBe(false)
	})
})

describe('shouldRecordView', () => {
	it('records a browser view of a party UUID', () => {
		expect(shouldRecordView(viewRequest(), PARTY_ID)).toBe(true)
	})

	it('skips prefetches, bots and ids that are not UUIDs', () => {
		expect(shouldRecordView(viewRequest({ purpose: 'prefetch' }), PARTY_ID)).toBe(false)
		expect(shouldRecordView(viewRequest({ 'user-agent': 'Googlebot/2.1' }), PARTY_ID)).toBe(false)
		expect(shouldRecordView(viewRequest(), 'abc123')).toBe(false)
		expect(shouldRecordView(viewRequest(), `${PARTY_ID}/../x`)).toBe(false)
	})
})
