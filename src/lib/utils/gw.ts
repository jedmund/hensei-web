/**
 * Guild War (Unite and Fight) utility functions and constants
 */

import {
	GW_ROUND_LABELS,
	type GwRound,
	type GwIndividualScore,
	type GwCrewScore,
	type GwChartDataPoint,
	type GwEvent,
	type EventScoreSummary
} from '$lib/types/api/gw'

// ============================================================================
// Chart Data Types
// ============================================================================

/**
 * Score data for a single round in a player chart
 */
export interface PlayerRoundScore {
	round: GwRound
	roundLabel: string
	score: number
	cumulative: number // Running total
}

/**
 * Data point for crew history chart
 */
export interface HistoryDataPoint {
	eventNumber: number
	eventLabel: string // "GW #72"
	totalScore: number
	date: string // For tooltip
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a score number with commas for display
 */
export function formatScore(score: number): string {
	return score.toLocaleString()
}

/**
 * Format a score number in compact form (e.g., 1.5b, 250m, 50k)
 * Used for chart axis labels where space is limited
 */
export function formatScoreCompact(score: number): string {
	const abs = Math.abs(score)
	const sign = score < 0 ? '-' : ''

	if (abs >= 1_000_000_000) {
		const value = abs / 1_000_000_000
		return sign + (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'b'
	}
	if (abs >= 1_000_000) {
		const value = abs / 1_000_000
		return sign + (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'm'
	}
	if (abs >= 1_000) {
		const value = abs / 1_000
		return sign + (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'k'
	}
	return sign + abs.toString()
}

/**
 * Parse a score string (with commas) back to a number
 */
export function parseScore(value: string): number {
	return parseInt(value.replace(/,/g, ''), 10)
}

/**
 * Element labels matching GranblueEnums::ELEMENTS
 */
export const ELEMENT_LABELS: Record<number, string> = {
	0: 'Null',
	1: 'Wind',
	2: 'Fire',
	3: 'Water',
	4: 'Earth',
	5: 'Dark',
	6: 'Light'
}

/**
 * Element CSS class names for badge styling
 */
export const ELEMENT_CSS_CLASSES: Record<number, string> = {
	0: 'null',
	1: 'wind',
	2: 'fire',
	3: 'water',
	4: 'earth',
	5: 'dark',
	6: 'light'
}

/**
 * Element hex colors for SVG rendering (used in dropdowns)
 */
export const ELEMENT_HEX_COLORS: Record<string, string> = {
	wind: '#3ee489',
	fire: '#fa6d6d',
	water: '#6cc9ff',
	earth: '#fd9f5b',
	dark: '#de7bff',
	light: '#e8d633'
}

/**
 * Get element hex color by element ID
 */
export function getElementColor(elementId: number): string {
	const className = ELEMENT_CSS_CLASSES[elementId]
	if (!className) return '#888'
	return ELEMENT_HEX_COLORS[className] ?? '#888'
}

// ============================================================================
// Chart Data Transformation Utilities
// ============================================================================

/**
 * Transform individual scores into chart-ready format
 */
export function toPlayerChartData(scores: GwIndividualScore[]): PlayerRoundScore[] {
	const byRound = new Map<GwRound, number>()

	for (const score of scores) {
		byRound.set(score.round, (byRound.get(score.round) ?? 0) + score.score)
	}

	let cumulative = 0
	const rounds: GwRound[] = [0, 1, 2, 3, 4, 5]

	return rounds.map((round) => {
		const score = byRound.get(round) ?? 0
		cumulative += score
		return {
			round,
			roundLabel: GW_ROUND_LABELS[round],
			score,
			cumulative
		}
	})
}

/**
 * Transform crew scores into chart-ready format for crew battle chart
 */
export function toCrewBattleChartData(crewScores: GwCrewScore[]): GwChartDataPoint[] {
	return crewScores
		.filter((s) => s.round >= 2) // Only Finals rounds
		.sort((a, b) => a.round - b.round)
		.map((s) => ({
			round: s.round,
			roundLabel: GW_ROUND_LABELS[s.round],
			crewScore: s.crewScore,
			opponentScore: s.opponentScore,
			memberContributions: []
		}))
}

/**
 * Build multi-player chart data from all individual scores
 */
export function toMultiPlayerChartData(
	allScores: GwIndividualScore[]
): Map<string, { name: string; scores: PlayerRoundScore[] }> {
	const byPlayer = new Map<string, { name: string; rawScores: GwIndividualScore[] }>()

	for (const score of allScores) {
		const playerId = score.member?.id ?? score.phantom?.id ?? score.playerName
		const existing = byPlayer.get(playerId)

		if (existing) {
			existing.rawScores.push(score)
		} else {
			byPlayer.set(playerId, {
				name: score.playerName,
				rawScores: [score]
			})
		}
	}

	const result = new Map<string, { name: string; scores: PlayerRoundScore[] }>()
	for (const [playerId, { name, rawScores }] of byPlayer) {
		result.set(playerId, {
			name,
			scores: toPlayerChartData(rawScores)
		})
	}

	return result
}

/**
 * Transform GW events into history chart data
 */
export function toCrewHistoryChartData(
	events: GwEvent[],
	formatDate: (date: string) => string
): HistoryDataPoint[] {
	return events
		.filter((e) => e.crewTotalScore !== undefined && e.crewTotalScore > 0)
		.sort((a, b) => a.eventNumber - b.eventNumber)
		.map((e) => ({
			eventNumber: e.eventNumber,
			eventLabel: `GW #${e.eventNumber}`,
			totalScore: e.crewTotalScore ?? 0,
			date: formatDate(e.startDate)
		}))
}

/**
 * Transform player event scores into history chart data
 */
export function toPlayerHistoryChartData(
	eventScores: EventScoreSummary[],
	formatDate: (date: string) => string
): HistoryDataPoint[] {
	return eventScores
		.filter((e) => e.totalScore > 0)
		.sort((a, b) => a.gwEvent.eventNumber - b.gwEvent.eventNumber)
		.map((e) => ({
			eventNumber: e.gwEvent.eventNumber,
			eventLabel: `GW #${e.gwEvent.eventNumber}`,
			totalScore: e.totalScore,
			date: formatDate(e.gwEvent.startDate)
		}))
}
