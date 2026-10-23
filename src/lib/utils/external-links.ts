/**
 * URL builders for external game resource sites
 * These convert stored database values into full URLs
 */

// Base URLs
const WIKI_EN_BASE = 'https://gbf.wiki'
const WIKI_JA_BASE = 'https://gbf-wiki.com'
const GAMEWITH_BASE = 'https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show'
const KAMIGAME_BASE = 'https://kamigame.jp'

// Kamigame paths by entity type
const KAMIGAME_PATHS = {
	character: '/グラブル/キャラクター',
	weapon: '/グラブル/武器',
	summon: '/グラブル/召喚石'
} as const

export type EntityType = 'character' | 'weapon' | 'summon'

/**
 * Build English wiki URL from page name
 * Input: "Florence (Dark)"
 * Output: "https://gbf.wiki/Florence_(Dark)"
 */
export function buildWikiEnUrl(pageName: string | undefined | null): string | null {
	if (!pageName?.trim()) return null
	// Wiki URLs use underscores for spaces
	const encoded = encodeURIComponent(pageName.trim().replace(/ /g, '_'))
	return `${WIKI_EN_BASE}/${encoded}`
}

// Japanese wiki paths by entity type
const WIKI_JA_PATHS = {
	character: '', // no prefix
	weapon: '武器/',
	summon: '召喚石/'
} as const

/**
 * Build Japanese wiki URL from page name
 * Input: "フロレンス (SSR)闇属性バージョン", entityType: "character"
 * Output: "https://gbf-wiki.com/?フロレンス+(SSR)闇属性バージョン"
 *
 * Input: "新神気鋭・猫之印 (SSR)", entityType: "weapon"
 * Output: "https://gbf-wiki.com/?武器/新神気鋭・猫之印+(SSR)"
 *
 * The type prefix is only added to bare titles. A stored title that already
 * contains a path (e.g. "武器/…" or "武器概要/四象武器#jfce0a20") is used as is,
 * matching the API's JpWikiDownloader. A "#anchor" stays a URL fragment.
 * (Outputs above are shown decoded; the page name is percent-encoded.)
 */
export function buildWikiJaUrl(
	pageName: string | undefined | null,
	entityType?: EntityType
): string | null {
	const trimmed = pageName?.trim()
	if (!trimmed) return null

	const hashIndex = trimmed.indexOf('#')
	const title = (hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex)).trim()
	const anchor = hashIndex === -1 ? '' : trimmed.slice(hashIndex + 1).trim()
	if (!title) return null

	const prefix = entityType && !title.includes('/') ? WIKI_JA_PATHS[entityType] : ''
	// PukiWiki takes the page name as the query string, with + for spaces
	const encoded = encodeURIComponent(prefix + title).replace(/%20/g, '+')
	const fragment = anchor ? `#${encodeURIComponent(anchor)}` : ''
	return `${WIKI_JA_BASE}/?${encoded}${fragment}`
}

/**
 * Build Gamewith URL from article ID
 * Input: "519325"
 * Output: "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/519325"
 */
export function buildGamewithUrl(articleId: string | number | undefined | null): string | null {
	if (!articleId) return null
	const id = String(articleId).trim()
	if (!id) return null
	return `${GAMEWITH_BASE}/${id}`
}

/**
 * Build Kamigame URL from slug and entity type
 *
 * Character input: "SSR水着リッチ"
 * Character output: "https://kamigame.jp/グラブル/キャラクター/SSR水着リッチ.html"
 *
 * Weapon input: "ブラインド・アンド・ストレイン", rarity: 3 (SSR)
 * Weapon output: "https://kamigame.jp/グラブル/武器/SSR/ブラインド・アンド・ストレイン.html"
 *
 * Summon input: "SSR/アグニス"
 * Summon output: "https://kamigame.jp/グラブル/召喚石/SSR/アグニス.html"
 */
export function buildKamigameUrl(
	slug: string | undefined | null,
	entityType: EntityType,
	rarity?: number
): string | null {
	if (!slug?.trim()) return null

	const basePath = KAMIGAME_PATHS[entityType]

	if (entityType === 'weapon' && rarity !== undefined) {
		// Weapons: rarity is a separate path segment
		const rarityPrefix = getRarityPrefix(rarity)
		const encodedPath = encodeURIPath(basePath)
		const encodedSlug = encodeURIComponent(slug.trim())
		return `${KAMIGAME_BASE}${encodedPath}/${rarityPrefix}/${encodedSlug}.html`
	}

	// Characters and summons: value includes rarity info
	const encodedPath = encodeURIPath(basePath)
	const encodedSlug = encodeURIComponent(slug.trim())
	return `${KAMIGAME_BASE}${encodedPath}/${encodedSlug}.html`
}

/**
 * Map rarity enum to string prefix
 */
function getRarityPrefix(rarity: number): string {
	const rarityMap: Record<number, string> = {
		3: 'SSR',
		2: 'SR',
		1: 'R'
	}
	return rarityMap[rarity] || 'SSR'
}

/**
 * Encode a path while preserving slashes
 */
function encodeURIPath(path: string): string {
	return path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/')
}
