/**
 * Full records for three contrasting artifact skills, shaped like
 * ArtifactSkillBlueprint (values from the production copy, 2026-11-01).
 */
import type { ArtifactSkill } from '$lib/types/api/artifact'

/** The blueprint sends unset game names as nulls, which the type doesn't say */
type WireSkill = Omit<ArtifactSkill, 'gameName'> & {
	gameName: { en: string | null; ja: string | null }
}

const wire = {
	// Group I, a value per quality, game name set
	atk: {
		id: 'as-atk',
		name: { en: 'ATK', ja: '攻撃力' },
		gameName: { en: 'ATK', ja: null },
		skillGroup: 'group_i',
		modifier: 1,
		polarity: 'positive',
		scoreCategory: 1,
		baseValues: [1320, 1440, 1560, 1680, 1800],
		growth: 300,
		suffix: { en: '', ja: '' }
	},
	// Group III, negative, one value for every quality
	flurry: {
		id: 'as-flurry',
		name: {
			en: 'Gain Flurry (3-hit / 1 time) after hitting a foe x times',
			ja: '敵に攻撃をx回与えると連撃効果'
		},
		gameName: { en: null, ja: null },
		skillGroup: 'group_iii',
		modifier: 20,
		polarity: 'negative',
		scoreCategory: 1,
		baseValues: [200],
		growth: -25,
		suffix: { en: '', ja: '' }
	},
	// No values and no growth (the blueprint leaves growth out)
	earrings: {
		id: 'as-earrings',
		name: {
			en: 'May find a random pair of earrings at end of battle',
			ja: '耳飾りを入手する場合がある'
		},
		gameName: { en: null, ja: null },
		skillGroup: 'group_iii',
		modifier: 29,
		polarity: 'positive',
		scoreCategory: 3,
		baseValues: [],
		suffix: { en: '', ja: '' }
	}
} satisfies Record<string, WireSkill>

export const records = wire as unknown as Record<keyof typeof wire, ArtifactSkill>
