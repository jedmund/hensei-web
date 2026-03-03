import { describe, it, expect } from 'vitest'
import {
	formatScore,
	formatScoreCompact,
	parseScore,
	getElementColor,
	toPlayerChartData,
	toCrewBattleChartData,
	toMultiPlayerChartData,
	toCrewHistoryChartData,
	toPlayerHistoryChartData,
	ELEMENT_LABELS,
	ELEMENT_CSS_CLASSES,
	ELEMENT_HEX_COLORS
} from '../gw'
import type { GwIndividualScore, GwCrewScore, GwEvent, EventScoreSummary } from '$lib/types/api/gw'

// ============================================================================
// Formatting
// ============================================================================

describe('formatScore', () => {
	it('formats with locale separators', () => {
		// toLocaleString is locale-dependent, just verify it returns a string
		expect(typeof formatScore(1000000)).toBe('string')
		expect(formatScore(0)).toBe('0')
	})
})

describe('formatScoreCompact', () => {
	it('formats billions', () => {
		expect(formatScoreCompact(1_000_000_000)).toBe('1b')
		expect(formatScoreCompact(1_500_000_000)).toBe('1.5b')
		expect(formatScoreCompact(2_000_000_000)).toBe('2b')
	})

	it('formats millions', () => {
		expect(formatScoreCompact(1_000_000)).toBe('1m')
		expect(formatScoreCompact(250_000_000)).toBe('250m')
		expect(formatScoreCompact(1_500_000)).toBe('1.5m')
	})

	it('formats thousands', () => {
		expect(formatScoreCompact(1_000)).toBe('1k')
		expect(formatScoreCompact(50_000)).toBe('50k')
		expect(formatScoreCompact(1_500)).toBe('1.5k')
	})

	it('returns raw number below 1000', () => {
		expect(formatScoreCompact(999)).toBe('999')
		expect(formatScoreCompact(0)).toBe('0')
		expect(formatScoreCompact(1)).toBe('1')
	})

	it('handles negative values', () => {
		expect(formatScoreCompact(-1_000_000)).toBe('-1m')
		expect(formatScoreCompact(-500)).toBe('-500')
	})
})

describe('parseScore', () => {
	it('parses comma-separated string', () => {
		expect(parseScore('1,000,000')).toBe(1000000)
	})

	it('parses plain number string', () => {
		expect(parseScore('12345')).toBe(12345)
	})
})

// ============================================================================
// Element utilities
// ============================================================================

describe('ELEMENT_LABELS', () => {
	it('maps all elements 0-6', () => {
		expect(ELEMENT_LABELS[0]).toBe('Null')
		expect(ELEMENT_LABELS[1]).toBe('Wind')
		expect(ELEMENT_LABELS[6]).toBe('Light')
	})
})

describe('ELEMENT_CSS_CLASSES', () => {
	it('maps all elements 0-6', () => {
		expect(ELEMENT_CSS_CLASSES[0]).toBe('null')
		expect(ELEMENT_CSS_CLASSES[2]).toBe('fire')
	})
})

describe('getElementColor', () => {
	it('returns hex color for valid element', () => {
		expect(getElementColor(1)).toBe(ELEMENT_HEX_COLORS['wind'])
		expect(getElementColor(2)).toBe(ELEMENT_HEX_COLORS['fire'])
	})

	it('returns #888 for unknown element', () => {
		expect(getElementColor(99)).toBe('#888')
	})

	it('returns #888 for null element (0)', () => {
		// ELEMENT_CSS_CLASSES[0] = 'null', which is not in ELEMENT_HEX_COLORS
		expect(getElementColor(0)).toBe('#888')
	})
})

// ============================================================================
// Chart data transformations
// ============================================================================

function makeIndividualScore(
	round: 0 | 1 | 2 | 3 | 4 | 5,
	score: number,
	playerName = 'Player1',
	memberId?: string
): GwIndividualScore {
	return {
		id: `score-${round}-${score}`,
		round,
		score,
		isCumulative: false,
		excused: false,
		playerName,
		playerType: 'member',
		member: memberId ? { id: memberId } as any : undefined
	}
}

describe('toPlayerChartData', () => {
	it('produces 6 round entries with cumulative totals', () => {
		const scores = [
			makeIndividualScore(0, 100),
			makeIndividualScore(1, 200),
			makeIndividualScore(2, 300),
			makeIndividualScore(3, 400),
			makeIndividualScore(4, 500),
			makeIndividualScore(5, 600)
		]

		const result = toPlayerChartData(scores)
		expect(result).toHaveLength(6)
		expect(result[0]!.round).toBe(0)
		expect(result[0]!.score).toBe(100)
		expect(result[0]!.cumulative).toBe(100)
		expect(result[5]!.cumulative).toBe(2100)
	})

	it('fills missing rounds with 0', () => {
		const scores = [makeIndividualScore(2, 500)]
		const result = toPlayerChartData(scores)
		expect(result[0]!.score).toBe(0)
		expect(result[1]!.score).toBe(0)
		expect(result[2]!.score).toBe(500)
		expect(result[2]!.cumulative).toBe(500)
	})

	it('aggregates duplicate rounds', () => {
		const scores = [
			makeIndividualScore(0, 100),
			makeIndividualScore(0, 200) // same round
		]
		const result = toPlayerChartData(scores)
		expect(result[0]!.score).toBe(300)
	})

	it('handles empty input', () => {
		const result = toPlayerChartData([])
		expect(result).toHaveLength(6)
		expect(result.every((r) => r.score === 0)).toBe(true)
	})

	it('includes round labels', () => {
		const result = toPlayerChartData([])
		expect(result[0]!.roundLabel).toBe('Preliminaries')
		expect(result[2]!.roundLabel).toBe('Finals Day 1')
	})
})

describe('toCrewBattleChartData', () => {
	it('filters to finals rounds only (>= 2)', () => {
		const crewScores: GwCrewScore[] = [
			{ id: '1', round: 0, crewScore: 100, opponentScore: 50, opponentName: null, opponentGranblueId: null, victory: null },
			{ id: '2', round: 1, crewScore: 200, opponentScore: 150, opponentName: null, opponentGranblueId: null, victory: null },
			{ id: '3', round: 2, crewScore: 300, opponentScore: 250, opponentName: 'OppCrew', opponentGranblueId: null, victory: true },
			{ id: '4', round: 3, crewScore: 400, opponentScore: 350, opponentName: 'OppCrew2', opponentGranblueId: null, victory: true }
		]

		const result = toCrewBattleChartData(crewScores)
		expect(result).toHaveLength(2)
		expect(result[0]!.round).toBe(2)
		expect(result[1]!.round).toBe(3)
	})

	it('sorts by round', () => {
		const crewScores: GwCrewScore[] = [
			{ id: '1', round: 5, crewScore: 500, opponentScore: 400, opponentName: null, opponentGranblueId: null, victory: null },
			{ id: '2', round: 2, crewScore: 200, opponentScore: 100, opponentName: null, opponentGranblueId: null, victory: null }
		]

		const result = toCrewBattleChartData(crewScores)
		expect(result[0]!.round).toBe(2)
		expect(result[1]!.round).toBe(5)
	})

	it('returns empty array when no finals rounds', () => {
		const crewScores: GwCrewScore[] = [
			{ id: '1', round: 0, crewScore: 100, opponentScore: 50, opponentName: null, opponentGranblueId: null, victory: null }
		]
		expect(toCrewBattleChartData(crewScores)).toHaveLength(0)
	})
})

describe('toMultiPlayerChartData', () => {
	it('groups scores by player', () => {
		const scores = [
			makeIndividualScore(0, 100, 'Alice', 'alice-id'),
			makeIndividualScore(1, 200, 'Alice', 'alice-id'),
			makeIndividualScore(0, 300, 'Bob', 'bob-id')
		]

		const result = toMultiPlayerChartData(scores)
		expect(result.size).toBe(2)

		const alice = result.get('alice-id')
		expect(alice).toBeDefined()
		expect(alice!.name).toBe('Alice')
		expect(alice!.scores).toHaveLength(6)
		expect(alice!.scores[0]!.score).toBe(100)
	})

	it('uses playerName as key when no member/phantom id', () => {
		const scores = [makeIndividualScore(0, 100, 'Anonymous')]
		const result = toMultiPlayerChartData(scores)
		expect(result.has('Anonymous')).toBe(true)
	})
})

describe('toCrewHistoryChartData', () => {
	const formatDate = (d: string) => `formatted:${d}`

	it('transforms events into history points', () => {
		const events: GwEvent[] = [
			{ id: '1', element: 1, startDate: '2025-01', endDate: '2025-02', eventNumber: 72, crewTotalScore: 5000 },
			{ id: '2', element: 2, startDate: '2025-03', endDate: '2025-04', eventNumber: 73, crewTotalScore: 8000 }
		]

		const result = toCrewHistoryChartData(events, formatDate)
		expect(result).toHaveLength(2)
		expect(result[0]!.eventLabel).toBe('GW #72')
		expect(result[0]!.totalScore).toBe(5000)
		expect(result[0]!.date).toBe('formatted:2025-01')
		expect(result[0]!.isGap).toBe(false)
	})

	it('sorts by event number', () => {
		const events: GwEvent[] = [
			{ id: '2', element: 2, startDate: '', endDate: '', eventNumber: 73, crewTotalScore: 100 },
			{ id: '1', element: 1, startDate: '', endDate: '', eventNumber: 71, crewTotalScore: 200 }
		]

		const result = toCrewHistoryChartData(events, formatDate)
		expect(result[0]!.eventNumber).toBe(71)
		expect(result[1]!.eventNumber).toBe(73)
	})

	it('filters out events with no/zero score', () => {
		const events: GwEvent[] = [
			{ id: '1', element: 1, startDate: '', endDate: '', eventNumber: 71 },
			{ id: '2', element: 2, startDate: '', endDate: '', eventNumber: 72, crewTotalScore: 0 },
			{ id: '3', element: 3, startDate: '', endDate: '', eventNumber: 73, crewTotalScore: 100 }
		]

		const result = toCrewHistoryChartData(events, formatDate)
		expect(result).toHaveLength(1)
		expect(result[0]!.eventNumber).toBe(73)
	})
})

describe('toPlayerHistoryChartData', () => {
	const formatDate = (d: string) => `fmt:${d}`

	it('marks in-crew events with score', () => {
		const eventScores: EventScoreSummary[] = [
			{
				gwEvent: { id: '1', element: 1, eventNumber: 72, startDate: '2025-01', endDate: '2025-02' },
				totalScore: 5000,
				inCrew: true
			}
		]

		const result = toPlayerHistoryChartData(eventScores, formatDate)
		expect(result[0]!.totalScore).toBe(5000)
		expect(result[0]!.isGap).toBe(false)
	})

	it('marks gap events with null score', () => {
		const eventScores: EventScoreSummary[] = [
			{
				gwEvent: { id: '1', element: 1, eventNumber: 72, startDate: '2025-01', endDate: '2025-02' },
				totalScore: null,
				inCrew: false
			}
		]

		const result = toPlayerHistoryChartData(eventScores, formatDate)
		expect(result[0]!.totalScore).toBeNull()
		expect(result[0]!.isGap).toBe(true)
	})

	it('sorts by event number', () => {
		const eventScores: EventScoreSummary[] = [
			{
				gwEvent: { id: '2', element: 1, eventNumber: 74, startDate: '', endDate: '' },
				totalScore: 100,
				inCrew: true
			},
			{
				gwEvent: { id: '1', element: 1, eventNumber: 72, startDate: '', endDate: '' },
				totalScore: 200,
				inCrew: true
			}
		]

		const result = toPlayerHistoryChartData(eventScores, formatDate)
		expect(result[0]!.eventNumber).toBe(72)
		expect(result[1]!.eventNumber).toBe(74)
	})
})
