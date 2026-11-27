import type { SparkMark } from '$lib/features/spark/spark'

/**
 * A spark saved to the signed-in user's account: the spark maker's `Spark`
 * plus the day they sparked. Private to its owner.
 */
export interface SavedSpark {
	id: string
	/** The day they sparked, as YYYY-MM-DD with no time zone */
	sparkDate: string
	characters: string[]
	moons: string[]
	summons: string[]
	sparked: SparkMark | null
	draws: number
	/** The gacha it was on, as the spark maker's pool and season values */
	pool: string | null
	season: string | null
	createdAt: string
	updatedAt: string
}

/** What create and update send (camelCase; the adapter snake-cases it) */
export type SavedSparkPayload = Pick<
	SavedSpark,
	'sparkDate' | 'characters' | 'moons' | 'summons' | 'sparked' | 'draws' | 'pool' | 'season'
>
