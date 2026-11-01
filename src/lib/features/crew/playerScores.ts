import type { GwCrewScore, GwIndividualScore, GwRound } from '$lib/types/api/gw'

/** One player's honors across an event, as listed on the event page */
export interface PlayerScore {
	id: string
	name: string
	type: 'member' | 'phantom'
	totalScore: number
	isRetired?: boolean | undefined
	scores: GwIndividualScore[]
}

/** A crew member who was in the crew while the event ran */
export interface EventMember {
	id: string
	user?: { id: string; username: string } | undefined
	retired: boolean
}

/**
 * Every player's total for an event, highest first. Members who were in the
 * crew during the event are listed with 0 even when they have no scores;
 * phantoms and other players appear once they have a score.
 */
export function buildPlayerScores(
	membersDuringEvent: EventMember[],
	individualScores: GwIndividualScore[] | undefined
): PlayerScore[] {
	const scoreMap = new Map<string, PlayerScore>()

	for (const member of membersDuringEvent) {
		if (member.user) {
			scoreMap.set(member.id, {
				id: member.id,
				name: member.user.username,
				type: 'member',
				totalScore: 0,
				isRetired: member.retired,
				scores: []
			})
		}
	}

	for (const score of individualScores ?? []) {
		const playerId = score.member?.id ?? score.phantom?.id ?? score.playerName
		const existing = scoreMap.get(playerId)

		if (existing) {
			existing.totalScore += score.score
			existing.scores.push(score)
		} else {
			// Phantom player or member not in membersDuringEvent
			scoreMap.set(playerId, {
				id: playerId,
				name: score.playerName,
				type: score.playerType,
				totalScore: score.score,
				isRetired: score.member?.retired,
				scores: [score]
			})
		}
	}

	return Array.from(scoreMap.values()).sort((a, b) => b.totalScore - a.totalScore)
}

/** Crew battles are recorded for Finals Day 1–4 */
export const CREW_SCORE_ROUNDS: GwRound[] = [2, 3, 4, 5]

/** Each finals round paired with its recorded crew score, if any */
export function crewScoresByRound(
	crewScores: GwCrewScore[]
): { round: GwRound; score: GwCrewScore | undefined }[] {
	return CREW_SCORE_ROUNDS.map((round) => ({
		round,
		score: crewScores.find((s) => s.round === round)
	}))
}
