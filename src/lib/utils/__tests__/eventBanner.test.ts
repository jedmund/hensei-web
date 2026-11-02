import { afterEach, describe, expect, it, vi } from 'vitest'

const locale = vi.hoisted(() => ({ current: 'en' as 'en' | 'ja' }))
vi.mock('$lib/utils/locale', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/utils/locale')>()),
	appLocale: () => locale.current
}))
vi.mock('$lib/utils/images/core', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/utils/images/core')>()),
	getHostedImageUrl: (url: string | null | undefined) => (url ? `https://cdn.test/${url}` : null)
}))

import { eventBanner, eventThumbnailUrl } from '../home'

const event = {
	imageUrl: 'events/series/exo_diablo_crucible.webp',
	imageUrlJa: 'events/series/exo_diablo_crucible.ja.webp',
	raids: []
}

afterEach(() => {
	locale.current = 'en'
})

describe('eventBanner', () => {
	it('gives English readers the English banner and no fallback', () => {
		expect(eventBanner(event)).toEqual({
			src: 'https://cdn.test/events/series/exo_diablo_crucible.webp',
			fallback: null
		})
	})

	it('gives Japanese readers the Japanese banner, falling back to English', () => {
		locale.current = 'ja'
		expect(eventBanner(event)).toEqual({
			src: 'https://cdn.test/events/series/exo_diablo_crucible.ja.webp',
			fallback: 'https://cdn.test/events/series/exo_diablo_crucible.webp'
		})
		expect(eventThumbnailUrl(event)).toBe(
			'https://cdn.test/events/series/exo_diablo_crucible.ja.webp'
		)
	})

	it('gives Japanese readers the English banner when there is no Japanese one', () => {
		locale.current = 'ja'
		expect(eventBanner({ ...event, imageUrlJa: null })).toEqual({
			src: 'https://cdn.test/events/series/exo_diablo_crucible.webp',
			fallback: null
		})
	})
})
