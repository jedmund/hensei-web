import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DifficultyAdapter } from '../difficulty.adapter'
import { API, EXPECTED } from './fixtures/difficulty.fixtures'
import { mockApiResponse } from './fixtures/helpers'

const BASE = 'https://api.example.com'

describe('DifficultyAdapter', () => {
	let adapter: DifficultyAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new DifficultyAdapter({ baseURL: BASE })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('listTiers', () => {
		it('omits the with_drafts param by default', async () => {
			global.fetch = mockApiResponse(API.tierList)

			await adapter.listTiers()

			const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulties`)
		})

		it('sends with_drafts=true when requested', async () => {
			global.fetch = mockApiResponse(API.tierListWithDrafts)

			await adapter.listTiers({ withDrafts: true })

			const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulties?with_drafts=true`)
		})

		it('transforms snake_case tier fields to camelCase', async () => {
			global.fetch = mockApiResponse([API.tier])

			const result = await adapter.listTiers()

			expect(result[0]).toEqual(EXPECTED.tier)
		})

		it('surfaces pending draft metadata on tiers when with_drafts=true', async () => {
			global.fetch = mockApiResponse(API.tierListWithDrafts)

			const result = await adapter.listTiers({ withDrafts: true })

			expect(result).toHaveLength(2)
			expect(result[1]).toMatchObject(EXPECTED.pendingTier)
		})
	})

	describe('tier mutations', () => {
		it('createTier POSTs the payload wrapped under `difficulty` in snake_case', async () => {
			global.fetch = mockApiResponse(API.createTierDraft)

			await adapter.createTier({
				name: 'Endgame',
				slug: 'endgame',
				minScore: 80,
				maxScore: 100,
				sortOrder: 30
			})

			expect(global.fetch).toHaveBeenCalledWith(
				`${BASE}/difficulties`,
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						difficulty: {
							name: 'Endgame',
							slug: 'endgame',
							min_score: 80,
							max_score: 100,
							sort_order: 30
						}
					})
				})
			)
		})

		it('createTier returns the staged draft, not the saved tier', async () => {
			global.fetch = mockApiResponse(API.createTierDraft)

			const result = await adapter.createTier({ slug: 'endgame' })

			expect(result.draft.id).toBe('draft-uuid-1')
			expect(result.draft.operation).toBe('create')
		})

		it('updateTier PUTs the payload under `difficulty` to the id-specific path', async () => {
			global.fetch = mockApiResponse(API.createTierDraft)

			await adapter.updateTier('tier-uuid-1', { name: 'Casual+' })

			expect(global.fetch).toHaveBeenCalledWith(
				`${BASE}/difficulties/tier-uuid-1`,
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ difficulty: { name: 'Casual+' } })
				})
			)
		})

		it('deleteTier DELETEs without a body', async () => {
			global.fetch = mockApiResponse(undefined)

			await adapter.deleteTier('tier-uuid-1')

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulties/tier-uuid-1`)
			expect((init as RequestInit).method).toBe('DELETE')
			expect((init as RequestInit).body).toBeUndefined()
		})
	})

	describe('components', () => {
		it('listComponents sends with_drafts=true only when requested', async () => {
			global.fetch = mockApiResponse(API.componentList)
			await adapter.listComponents()
			let [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_components`)
			;(global.fetch as ReturnType<typeof vi.fn>).mockClear()

			global.fetch = mockApiResponse(API.componentList)
			await adapter.listComponents({ withDrafts: true })
			;[url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_components?with_drafts=true`)
		})

		it('updateComponent wraps the payload under `difficulty_component` and uses the id/name segment', async () => {
			global.fetch = mockApiResponse(API.createTierDraft)

			await adapter.updateComponent('weapon', {
				weight: 2,
				enabled: false,
				minCountToScore: 5,
				targetMax: null
			})

			expect(global.fetch).toHaveBeenCalledWith(
				`${BASE}/difficulty_components/weapon`,
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({
						difficulty_component: {
							weight: 2,
							enabled: false,
							min_count_to_score: 5,
							target_max: null
						}
					})
				})
			)
		})

		it('transforms component response fields including targetMax', async () => {
			global.fetch = mockApiResponse([API.component])

			const result = await adapter.listComponents()

			expect(result[0]).toEqual(EXPECTED.component)
		})
	})

	describe('rules', () => {
		it('listRules only sends the filters that are set', async () => {
			global.fetch = mockApiResponse(API.ruleList)

			await adapter.listRules({ component: 'weapon', active: true })

			const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			const parsed = new URL(url as string)
			expect(parsed.pathname).toBe('/difficulty_rules')
			expect(parsed.searchParams.get('component')).toBe('weapon')
			expect(parsed.searchParams.get('active')).toBe('true')
			expect(parsed.searchParams.has('with_drafts')).toBe(false)
		})

		it('listRules forwards withDrafts but skips it when false-y', async () => {
			global.fetch = mockApiResponse(API.ruleList)
			await adapter.listRules({ withDrafts: true })
			let [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(new URL(url as string).searchParams.get('with_drafts')).toBe('true')
			;(global.fetch as ReturnType<typeof vi.fn>).mockClear()

			global.fetch = mockApiResponse(API.ruleList)
			await adapter.listRules({ withDrafts: false })
			;[url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(new URL(url as string).searchParams.has('with_drafts')).toBe(false)
		})

		it('listRules sends no query string when filters is undefined', async () => {
			global.fetch = mockApiResponse(API.ruleList)

			await adapter.listRules()

			const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_rules`)
		})

		it('listRules treats active=false as a sent filter (distinct from undefined)', async () => {
			global.fetch = mockApiResponse(API.ruleList)

			await adapter.listRules({ active: false })

			const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(new URL(url as string).searchParams.get('active')).toBe('false')
		})

		it('preserves rule.params keys across the transform layer', async () => {
			// params is a free-form bag scoped to the rule engine; snake_case keys
			// inside it must round-trip unchanged in both directions.
			global.fetch = mockApiResponse([API.rule])

			const result = await adapter.listRules()

			expect(result[0]).toEqual(EXPECTED.rule)
			expect(result[0]?.params).toEqual({ series_id: 9, min_count: 1 })
		})

		it('createRule wraps the payload under `difficulty_rule` and preserves params keys outbound', async () => {
			global.fetch = mockApiResponse(API.createTierDraft)

			await adapter.createRule({
				name: 'New rule',
				component: 'weapon',
				ruleType: 'series_present',
				params: { min_count: 2, series_id: 9 },
				weight: 3,
				active: true
			})

			const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			const body = JSON.parse((init as RequestInit).body as string)
			expect(body.difficulty_rule).toMatchObject({
				name: 'New rule',
				component: 'weapon',
				rule_type: 'series_present',
				weight: 3,
				active: true
			})
			// Keys inside params stay snake_case (no camelCase transform)
			expect(body.difficulty_rule.params).toEqual({ min_count: 2, series_id: 9 })
		})

		it('getRuleTypes returns the types and grouped map', async () => {
			global.fetch = mockApiResponse(API.ruleTypes)

			const result = await adapter.getRuleTypes()

			expect(result.types).toEqual(API.ruleTypes.types)
			expect(result.grouped).toEqual(API.ruleTypes.grouped)
		})

		it('deleteRule DELETEs the rule by id', async () => {
			global.fetch = mockApiResponse(undefined)

			await adapter.deleteRule('rule-uuid-1')

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_rules/rule-uuid-1`)
			expect((init as RequestInit).method).toBe('DELETE')
		})
	})

	describe('preview', () => {
		it('POSTs { shortcode } to /difficulty_previews', async () => {
			global.fetch = mockApiResponse(API.preview)

			await adapter.preview('qRf1iR')

			expect(global.fetch).toHaveBeenCalledWith(
				`${BASE}/difficulty_previews`,
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ shortcode: 'qRf1iR' })
				})
			)
		})

		it('returns score, tier and rulesetVersion on a scoreable party', async () => {
			global.fetch = mockApiResponse(API.preview)

			const result = await adapter.preview('qRf1iR')

			expect(result.scoreable).toBe(true)
			expect(result.score).toBe(EXPECTED.preview.score)
			expect(result.rulesetVersion).toBe(EXPECTED.preview.rulesetVersion)
			expect(result.tier?.slug).toBe('mid')
		})

		it('returns null score/tier/breakdown for an unscoreable party', async () => {
			global.fetch = mockApiResponse(API.previewUnscoreable)

			const result = await adapter.preview('qRf1iR')

			expect(result.scoreable).toBe(false)
			expect(result.score).toBeNull()
			expect(result.tier).toBeNull()
			expect(result.breakdown).toBeNull()
		})
	})

	describe('drafts workspace', () => {
		it('listDrafts returns the drafts array + pendingCount', async () => {
			global.fetch = mockApiResponse(API.listDrafts)

			const result = await adapter.listDrafts()

			expect(result.pendingCount).toBe(1)
			expect(result.drafts).toHaveLength(1)
			expect(result.drafts[0]?.operation).toBe('create')
		})

		it('getDiff returns the diff structure and pendingCount', async () => {
			global.fetch = mockApiResponse(API.getDiff)

			const result = await adapter.getDiff()

			expect(result.pendingCount).toBe(0)
			expect(result.diff.tiers.creates).toEqual([])
			expect(result.diff.rules.updates).toEqual([])
			expect(result.diff.components.destroys).toEqual([])
		})

		it('stageDraft POSTs the draft payload', async () => {
			global.fetch = mockApiResponse(API.listDrafts.drafts[0])

			await adapter.stageDraft({
				targetType: 'Difficulty',
				targetId: null,
				operation: 'create',
				attributes: { slug: 'endgame' }
			})

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_drafts`)
			expect((init as RequestInit).method).toBe('POST')
			const body = JSON.parse((init as RequestInit).body as string)
			expect(body).toEqual({
				draft: {
					target_type: 'Difficulty',
					target_id: null,
					operation: 'create',
					attributes: { slug: 'endgame' }
				}
			})
		})

		it('deleteDraft hits the id-specific path with DELETE', async () => {
			global.fetch = mockApiResponse(undefined)

			await adapter.deleteDraft('draft-uuid-1')

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_drafts/draft-uuid-1`)
			expect((init as RequestInit).method).toBe('DELETE')
		})

		it('discardDrafts DELETEs /difficulty_drafts/all and surfaces the count', async () => {
			global.fetch = mockApiResponse(API.discard)

			const result = await adapter.discardDrafts()

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_drafts/all`)
			expect((init as RequestInit).method).toBe('DELETE')
			expect(result.discarded).toBe(3)
		})

		it('commitDrafts POSTs { note } and returns the camelCased commit result', async () => {
			global.fetch = mockApiResponse(API.commit)

			const result = await adapter.commitDrafts('tune weapon weights')

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_drafts/commit`)
			expect((init as RequestInit).method).toBe('POST')
			expect((init as RequestInit).body).toBe(JSON.stringify({ note: 'tune weapon weights' }))
			expect(result).toEqual(EXPECTED.commit)
		})

		it('uploadDraftImage POSTs the base64 + filename to the per-draft upload path', async () => {
			global.fetch = mockApiResponse(API.uploadDraftImage)

			await adapter.uploadDraftImage('draft-uuid-1', 'BASE64DATA', 'endgame.png')

			const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			expect(url).toBe(`${BASE}/difficulty_drafts/draft-uuid-1/upload_image`)
			expect((init as RequestInit).method).toBe('POST')
			expect((init as RequestInit).body).toBe(
				JSON.stringify({ image: 'BASE64DATA', filename: 'endgame.png' })
			)
		})

		it('uploadDraftImage allows a missing filename', async () => {
			global.fetch = mockApiResponse(API.uploadDraftImage)

			await adapter.uploadDraftImage('draft-uuid-1', 'BASE64DATA')

			const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
			const body = JSON.parse((init as RequestInit).body as string)
			expect(body.image).toBe('BASE64DATA')
			expect(body.filename).toBeUndefined()
		})
	})
})
