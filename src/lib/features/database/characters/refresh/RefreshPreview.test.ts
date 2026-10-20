import { describe, it, expect, vi } from 'vitest'
import { render } from 'svelte/server'
import RefreshPreview from './RefreshPreview.svelte'
import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
import { CharacterRefreshAdapter } from '$lib/api/adapters/characterRefresh.adapter'
import { API } from '$lib/api/adapters/__tests__/fixtures/characterRefresh.fixtures'

// Text content of the server render, without Svelte's hydration comments.
function text(html: string): string {
	return html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
}

async function preview(body: unknown) {
	const original = global.fetch
	global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => body })
	try {
		return (await new CharacterRefreshAdapter({ baseURL: 'https://x' }).preview('c')).refresh
	} finally {
		global.fetch = original
	}
}

describe('RefreshPreview', () => {
	it('shows the wiki states, counts, changes by kind and icon fallbacks', async () => {
		const result = await preview(API.reparsePreviewChanges)
		const out = text(render(RefreshPreview, { props: { result } }).body)

		expect(out).toContain('English wiki Changed')
		expect(out).toContain('Japanese wiki Unchanged')
		expect(out).toContain('Effects 4 added, 1 updated, 2 removed')
		expect(out).toContain('Abilities')
		expect(out).toContain('Support skills')
		expect(out).toContain('Changed Jinx of the Tiger description, Japanese description, effects')
		expect(out).toContain('New Tiger')
		expect(out).toContain('Icons from the wiki')
		expect(out).toContain('Abilities: Tiger')
		expect(out).not.toContain('Nothing changed')
	})

	it('says nothing changed, and shows the JP wiki as not fetched', async () => {
		const result = await preview(API.reparsePreviewNoChanges)
		const out = text(render(RefreshPreview, { props: { result } }).body)

		expect(out).toContain('Nothing changed')
		expect(out).toContain('Japanese wiki Not fetched')
		expect(out).not.toContain('Abilities')
		expect(out).not.toContain('Icons from the wiki')
	})
})

describe('EntityRawDataTab', () => {
	it('keeps the checkbox and Re-parse for weapons and summons', () => {
		const out = text(
			render(EntityRawDataTab, {
				props: { wikiRaw: 'text', canEdit: true, onReparse: async () => null }
			}).body
		)
		expect(out).toContain('Fetch fresh wikitext first')
		expect(out).toContain('Re-parse')
		expect(out).not.toContain('wiki fetched')
	})

	it('shows when the stored wikitext was fetched', () => {
		const out = text(
			render(EntityRawDataTab, {
				props: {
					wikiRaw: 'text',
					fetchedAt: { en: '2026-10-20T12:00:00Z', jp: null }
				}
			}).body
		)
		expect(out).toContain('English wiki fetched')
		expect(out).toContain('Japanese wiki fetched Never')
	})
})
