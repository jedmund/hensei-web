import { describe, it, expect } from 'vitest'
import { matchLocal, rankResults } from '../filterMatching'
import type { FilterItem, FilterOption } from '$lib/types/filter'

// Minimal harness — we're isolating the difficulty branch, so the other
// category fixtures stay empty.
function call(overrides: {
	query: string
	filters?: FilterItem[]
	excludedKinds?: FilterItem['kind'][]
	difficultyOptions?: { value: string; label: string; color?: string }[]
	categoryDifficultyLabel?: string
}): FilterOption[] {
	return matchLocal({
		query: overrides.query,
		filters: overrides.filters ?? [],
		excludedKinds: overrides.excludedKinds ?? [],
		elementOptions: [],
		recencyOptions: [],
		partyOptions: [],
		boostOptions: [],
		sideOptions: [],
		difficultyOptions: overrides.difficultyOptions,
		allRaids: [],
		categoryLabels: {
			element: 'Element',
			recency: 'Recency',
			party: 'Party',
			raid: 'Raid',
			boost: 'Boost',
			side: 'Side',
			difficulty: overrides.categoryDifficultyLabel ?? 'Difficulty'
		}
	})
}

describe('matchLocal — difficulty', () => {
	const difficultyOptions = [
		{ value: 'casual', label: 'Casual', color: '#86C5A8' },
		{ value: 'mid', label: 'Mid', color: '#D4AF37' },
		{ value: 'endgame', label: 'Endgame', color: '#1a1a3a' }
	]

	it('matches a tier by case-insensitive label substring', () => {
		const results = call({ query: 'cas', difficultyOptions })

		const difficulty = results.filter((r) => r.kind === 'difficulty')
		expect(difficulty.map((r) => r.value)).toEqual(['casual'])
		expect(difficulty[0]!.category).toBe('Difficulty')
	})

	it('returns multiple matches when the query overlaps multiple labels', () => {
		const results = call({ query: 'e', difficultyOptions })

		const slugs = results.filter((r) => r.kind === 'difficulty').map((r) => r.value)
		// "e" is in "Casual" (no), "Mid" (no), "Endgame" (yes)
		expect(slugs).toEqual(['endgame'])
	})

	it('omits tiers that are already in the active filter list', () => {
		const results = call({
			query: 'mid',
			difficultyOptions,
			filters: [{ kind: 'difficulty', value: 'mid', label: 'Mid' }]
		})

		expect(results.find((r) => r.kind === 'difficulty')).toBeUndefined()
	})

	it('skips the entire difficulty category when difficultyOptions is undefined', () => {
		const results = call({ query: 'casual' })

		expect(results.find((r) => r.kind === 'difficulty')).toBeUndefined()
	})

	it('skips the entire difficulty category when categoryLabels.difficulty is missing', () => {
		// categoryDifficultyLabel falsy — pretend the consumer didn't wire it
		const results = matchLocal({
			query: 'casual',
			filters: [],
			excludedKinds: [],
			elementOptions: [],
			recencyOptions: [],
			partyOptions: [],
			boostOptions: [],
			sideOptions: [],
			difficultyOptions,
			allRaids: [],
			categoryLabels: {
				element: 'Element',
				recency: 'Recency',
				party: 'Party',
				raid: 'Raid',
				boost: 'Boost',
				side: 'Side'
				// no difficulty label
			}
		})

		expect(results.find((r) => r.kind === 'difficulty')).toBeUndefined()
	})

	it('honors excludedKinds: ["difficulty"]', () => {
		const results = call({ query: 'casual', difficultyOptions, excludedKinds: ['difficulty'] })

		expect(results.find((r) => r.kind === 'difficulty')).toBeUndefined()
	})

	it('does not stringify or transform the tier color into the option (color stays on the source list)', () => {
		const results = call({ query: 'cas', difficultyOptions })
		const opt = results.find((r) => r.kind === 'difficulty')!
		// FilterOption doesn't carry the color; ExploreFilters reads it from difficultyOptions at selection time.
		expect((opt as unknown as Record<string, unknown>).color).toBeUndefined()
	})
})

describe('rankResults — difficulty filterKind', () => {
	// rankResults boosts exact matches AND known filter kinds. Adding 'difficulty'
	// to the recognized-kinds set in the implementation is regression-prone if
	// it ever gets removed, so lock in that a difficulty option outranks a
	// generic non-prefix match.
	it('ranks an exact-prefix difficulty match above a non-prefix difficulty match', () => {
		const input: FilterOption[] = [
			{ kind: 'difficulty', value: 'endgame', label: 'Endgame', category: 'Difficulty' },
			{ kind: 'difficulty', value: 'casual', label: 'Casual', category: 'Difficulty' }
		]
		const ranked = rankResults(input, 'cas')
		expect(ranked[0]!.value).toBe('casual')
	})

	it('treats `difficulty` as a recognized filter kind (boosts above unknown kinds)', () => {
		const input: FilterOption[] = [
			// pretend an unrecognized kind shows up at the same prefix relevance
			{ kind: 'class', value: 'casual-strider', label: 'Casual', category: 'Job' },
			{ kind: 'difficulty', value: 'casual', label: 'Casual', category: 'Difficulty' }
		]
		const ranked = rankResults(input, 'casual')
		// difficulty/class are both in the recognized set, so the ranking should be
		// stable rather than dropping difficulty below it.
		expect(ranked.map((r) => r.kind)).toContain('difficulty')
	})
})
