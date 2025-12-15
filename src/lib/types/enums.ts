export enum GridType {
	Character = 'character',
	Weapon = 'weapon',
	Summon = 'summon'
}

export enum TeamElement {
	Any = 0,
	Wind = 1,
	Fire = 2,
	Water = 3,
	Earth = 4,
	Dark = 5,
	Light = 6
}

export function getElementClass(element: number): string | null {
	switch (element) {
		case TeamElement.Wind:
			return 'wind'
		case TeamElement.Fire:
			return 'fire'
		case TeamElement.Water:
			return 'water'
		case TeamElement.Earth:
			return 'earth'
		case TeamElement.Dark:
			return 'dark'
		case TeamElement.Light:
			return 'light'
		default:
			return null
	}
}

// Character season - display disambiguation for seasonal variants (e.g., "Vane [Halloween]")
// If no season, value should be null (not a default value)
export enum CharacterSeason {
	Valentine = 1,
	Formal = 2,
	Summer = 3,
	Halloween = 4,
	Holiday = 5
}

export const CHARACTER_SEASON_NAMES: Record<number, string> = {
	[CharacterSeason.Valentine]: 'Valentine',
	[CharacterSeason.Formal]: 'Formal',
	[CharacterSeason.Summer]: 'Summer',
	[CharacterSeason.Halloween]: 'Halloween',
	[CharacterSeason.Holiday]: 'Holiday'
}

export function getSeasonName(season: number | null): string | null {
	if (season === null) return null
	return CHARACTER_SEASON_NAMES[season] ?? null
}

// Character series (identity/pool membership)
export enum CharacterSeries {
	Standard = 1,
	Grand = 2,
	Zodiac = 3,
	Promo = 4,
	Collab = 5,
	Eternal = 6,
	Evoker = 7,
	Saint = 8,
	Fantasy = 9,
	Summer = 10,
	Yukata = 11,
	Valentine = 12,
	Halloween = 13,
	Formal = 14,
	Holiday = 15,
	Event = 16
}

export const CHARACTER_SERIES_NAMES: Record<number, string> = {
	[CharacterSeries.Standard]: 'Standard',
	[CharacterSeries.Grand]: 'Grand',
	[CharacterSeries.Zodiac]: 'Zodiac',
	[CharacterSeries.Promo]: 'Promo',
	[CharacterSeries.Collab]: 'Collab',
	[CharacterSeries.Eternal]: 'Eternal',
	[CharacterSeries.Evoker]: 'Evoker',
	[CharacterSeries.Saint]: 'Saint',
	[CharacterSeries.Fantasy]: 'Fantasy',
	[CharacterSeries.Summer]: 'Summer',
	[CharacterSeries.Yukata]: 'Yukata',
	[CharacterSeries.Valentine]: 'Valentine',
	[CharacterSeries.Halloween]: 'Halloween',
	[CharacterSeries.Formal]: 'Formal',
	[CharacterSeries.Holiday]: 'Holiday',
	[CharacterSeries.Event]: 'Event'
}

export function getSeriesNames(series: number[]): string[] {
	return series
		.map((s) => CHARACTER_SERIES_NAMES[s])
		.filter((name): name is string => Boolean(name))
}

// Weapon/Summon promotions (gacha pool membership)
export enum Promotion {
	Premium = 1,
	Classic = 2,
	ClassicII = 3,
	Flash = 4,
	Legend = 5,
	Valentine = 6,
	Summer = 7,
	Halloween = 8,
	Holiday = 9,
	Collab = 10,
	Formal = 11
}

export const PROMOTION_NAMES: Record<number, string> = {
	[Promotion.Premium]: 'Premium',
	[Promotion.Classic]: 'Classic',
	[Promotion.ClassicII]: 'Classic II',
	[Promotion.Flash]: 'Flash',
	[Promotion.Legend]: 'Legend',
	[Promotion.Valentine]: 'Valentine',
	[Promotion.Summer]: 'Summer',
	[Promotion.Halloween]: 'Halloween',
	[Promotion.Holiday]: 'Holiday',
	[Promotion.Collab]: 'Collab',
	[Promotion.Formal]: 'Formal'
}

export function getPromotionNames(promotions: number[]): string[] {
	return promotions.map((p) => PROMOTION_NAMES[p]).filter((name): name is string => Boolean(name))
}
