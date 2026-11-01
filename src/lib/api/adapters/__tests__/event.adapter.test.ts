import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventAdapter } from '../event.adapter'
import { FeaturedPartyAdapter } from '../featuredParty.adapter'
import { HomeAdapter } from '../home.adapter'
import { mockApiResponse } from './fixtures/helpers'
import { ElementId } from '$lib/utils/element'

const apiEvent = {
	id: 'ev-1',
	name: { en: 'Unite and Fight', ja: '星の古戦場' },
	kind: 'unite_and_fight',
	element: ElementId.Water,
	advantage_element: ElementId.Earth,
	starts_at: '2026-10-20T10:00:00Z',
	ends_at: '2026-10-27T14:59:00Z',
	status: 'draft',
	image_url: null,
	raids: [],
	event_number: 80
}

function calls() {
	return (global.fetch as ReturnType<typeof vi.fn>).mock.calls
}

describe('EventAdapter', () => {
	let adapter: EventAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new EventAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('listEvents sends filters and camelCases events', async () => {
		global.fetch = mockApiResponse({ events: [apiEvent] })

		const result = await adapter.listEvents({
			scope: 'current',
			kind: 'unite_and_fight',
			status: 'all'
		})

		expect(calls()[0]![0]).toBe(
			'https://api.example.com/events?scope=current&kind=unite_and_fight&status=all'
		)
		expect(result[0]).toMatchObject({
			startsAt: '2026-10-20T10:00:00Z',
			endsAt: '2026-10-27T14:59:00Z',
			advantageElement: ElementId.Earth,
			eventNumber: 80
		})
	})

	it('createEvent POSTs the event envelope', async () => {
		global.fetch = mockApiResponse(apiEvent)

		await adapter.createEvent({
			nameEn: 'Unite and Fight',
			nameJp: '星の古戦場',
			kind: 'unite_and_fight',
			series: 'unite_and_fight',
			element: ElementId.Water,
			startsAt: '2026-10-20T10:00:00.000Z',
			endsAt: '2026-10-27T14:59:00.000Z',
			raidIds: ['r1'],
			eventNumber: 80
		})

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/events')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			event: {
				name_en: 'Unite and Fight',
				name_jp: '星の古戦場',
				kind: 'unite_and_fight',
				series: 'unite_and_fight',
				element: ElementId.Water,
				starts_at: '2026-10-20T10:00:00.000Z',
				ends_at: '2026-10-27T14:59:00.000Z',
				raid_ids: ['r1'],
				event_number: 80
			}
		})
	})

	it('approve, hide and sync POST to their member routes', async () => {
		global.fetch = mockApiResponse(apiEvent)
		await adapter.approveEvent('ev-1')
		await adapter.hideEvent('ev-1')
		const statusCalls = calls()
		expect(statusCalls.map(([url, init]) => [url, init.method])).toEqual([
			['https://api.example.com/events/ev-1/approve', 'POST'],
			['https://api.example.com/events/ev-1/hide', 'POST']
		])

		global.fetch = mockApiResponse({ queued: true })
		const sync = await adapter.runSync()
		expect(sync).toEqual({ queued: true })
		expect(calls()[0]![0]).toBe('https://api.example.com/events/sync')
	})

	it('uploadImage sends multipart form data', async () => {
		global.fetch = mockApiResponse(apiEvent)

		await adapter.uploadImage('ev-1', new Blob(['x'], { type: 'image/webp' }), 'banner.webp')

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/events/ev-1/upload_image')
		expect(init.body).toBeInstanceOf(FormData)
	})
})

describe('FeaturedPartyAdapter', () => {
	let originalFetch: typeof global.fetch
	const adapter = new FeaturedPartyAdapter({ baseURL: 'https://api.example.com' })

	beforeEach(() => {
		originalFetch = global.fetch
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('createFeaturedParty POSTs the featured_party envelope', async () => {
		global.fetch = mockApiResponse({ id: 'fp-1' })

		await adapter.createFeaturedParty({
			eventId: 'ev-1',
			partyId: 'p-1',
			position: 0,
			noteEn: 'Good',
			noteJp: '良い'
		})

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/featured_parties')
		expect(JSON.parse(init.body)).toEqual({
			featured_party: {
				event_id: 'ev-1',
				party_id: 'p-1',
				position: 0,
				note_en: 'Good',
				note_jp: '良い'
			}
		})
	})

	it('listFeaturedParties filters by event', async () => {
		global.fetch = mockApiResponse({ featured_parties: [] })

		const result = await adapter.listFeaturedParties({ eventId: 'ev-1' })

		expect(calls()[0]![0]).toBe('https://api.example.com/featured_parties?event_id=ev-1')
		expect(result).toEqual([])
	})
})

describe('HomeAdapter', () => {
	let originalFetch: typeof global.fetch
	const adapter = new HomeAdapter({ baseURL: 'https://api.example.com' })

	beforeEach(() => {
		originalFetch = global.fetch
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('getHome fetches /home and camelCases sections', async () => {
		global.fetch = mockApiResponse({
			current: [{ event: apiEvent, raids: [] }],
			upcoming: [{ event: apiEvent, previous_event: null, raids: [] }],
			rising: [],
			staff_picks: [{ id: 'fp', event_id: null, position: 0, note: { en: '', ja: '' }, party: {} }]
		})

		const result = await adapter.getHome()

		expect(calls()[0]![0]).toBe('https://api.example.com/home')
		expect(result.upcoming[0]?.previousEvent).toBeNull()
		expect(result.staffPicks[0]?.eventId).toBeNull()
	})
})
