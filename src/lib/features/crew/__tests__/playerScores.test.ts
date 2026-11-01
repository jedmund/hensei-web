import { describe, it, expect } from 'vitest'
import type { GwCrewScore, GwIndividualScore } from '$lib/types/api/gw'
import type { CrewMembership, PhantomPlayer } from '$lib/types/api/crew'
import { buildPlayerScores, crewScoresByRound, type EventMember } from '../playerScores'

function individual(overrides: Partial<GwIndividualScore>): GwIndividualScore {
	return {
		id: 's1',
		round: 0,
		score: 0,
		isCumulative: false,
		excused: false,
		playerName: 'player',
		playerType: 'member',
		...overrides
	}
}

const alice: EventMember = { id: 'm1', user: { id: 'u1', username: 'alice' }, retired: false }
const bob: EventMember = { id: 'm2', user: { id: 'u2', username: 'bob' }, retired: true }

describe('buildPlayerScores', () => {
	it('lists members of the crew during the event at 0', () => {
		expect(buildPlayerScores([alice, bob], undefined)).toEqual([
			{ id: 'm1', name: 'alice', type: 'member', totalScore: 0, isRetired: false, scores: [] },
			{ id: 'm2', name: 'bob', type: 'member', totalScore: 0, isRetired: true, scores: [] }
		])
	})

	it('skips members without a user', () => {
		expect(buildPlayerScores([{ id: 'm3', retired: false }], [])).toEqual([])
	})

	it('sums a member’s scores and keeps each one', () => {
		const day1 = individual({
			id: 'a',
			score: 100,
			member: { id: 'm1' } as CrewMembership
		})
		const day2 = individual({
			id: 'b',
			round: 2,
			score: 250,
			member: { id: 'm1' } as CrewMembership
		})
		const [player] = buildPlayerScores([alice], [day1, day2])
		expect(player?.totalScore).toBe(350)
		expect(player?.scores).toEqual([day1, day2])
	})

	it('adds phantoms and unknown players from their scores', () => {
		const phantomScore = individual({
			id: 'p',
			score: 40,
			playerName: 'ghost',
			playerType: 'phantom',
			phantom: { id: 'ph1' } as PhantomPlayer
		})
		const byName = individual({ id: 'n', score: 10, playerName: 'carol' })
		const formerMember = individual({
			id: 'f',
			score: 5,
			playerName: 'dave',
			member: { id: 'm9', retired: true } as CrewMembership
		})

		expect(buildPlayerScores([], [phantomScore, byName, formerMember])).toEqual([
			{
				id: 'ph1',
				name: 'ghost',
				type: 'phantom',
				totalScore: 40,
				isRetired: undefined,
				scores: [phantomScore]
			},
			{
				id: 'carol',
				name: 'carol',
				type: 'member',
				totalScore: 10,
				isRetired: undefined,
				scores: [byName]
			},
			{
				id: 'm9',
				name: 'dave',
				type: 'member',
				totalScore: 5,
				isRetired: true,
				scores: [formerMember]
			}
		])
	})

	it('sorts by total, highest first', () => {
		const scores = [
			individual({ id: 'a', score: 10, member: { id: 'm1' } as CrewMembership }),
			individual({ id: 'b', score: 90, member: { id: 'm2' } as CrewMembership })
		]
		expect(buildPlayerScores([alice, bob], scores).map((p) => p.name)).toEqual(['bob', 'alice'])
	})
})

describe('crewScoresByRound', () => {
	const day2: GwCrewScore = {
		id: 'c1',
		round: 3,
		crewScore: 1000,
		opponentScore: 900,
		opponentName: 'Rivals',
		opponentGranblueId: null,
		victory: true
	}

	it('lists Finals Day 1–4 in order', () => {
		expect(crewScoresByRound([]).map((r) => r.round)).toEqual([2, 3, 4, 5])
	})

	it('pairs each round with its score', () => {
		expect(crewScoresByRound([day2])).toEqual([
			{ round: 2, score: undefined },
			{ round: 3, score: day2 },
			{ round: 4, score: undefined },
			{ round: 5, score: undefined }
		])
	})

	it('ignores preliminary rounds', () => {
		expect(crewScoresByRound([{ ...day2, round: 0 }]).every((r) => r.score === undefined)).toBe(
			true
		)
	})
})
