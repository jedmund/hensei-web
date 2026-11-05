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
	summon: '/グラブル/召喚石',
	// Events sit under their own folders (イベント, 神滅戦, ...), so the stored path
	// carries the folder
	event: '/グラブル'
} as const

export type EntityType = 'character' | 'weapon' | 'summon'
/** What a Kamigame link can point at: units, and events */
export type KamigameType = EntityType | 'event'

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
 *
 * Event input: "イベント/天上劇団もぐら座/index" (the path under グラブル, without .html)
 * Event output: "https://kamigame.jp/グラブル/イベント/天上劇団もぐら座/index.html"
 */
export function buildKamigameUrl(
	slug: string | undefined | null,
	entityType: KamigameType,
	rarity?: number
): string | null {
	if (!slug?.trim()) return null

	const basePath = KAMIGAME_PATHS[entityType]

	if (entityType === 'event') {
		// Event pages sit in folders (<event>/index.html), so the slashes stay
		return `${KAMIGAME_BASE}${encodeURIPath(basePath)}/${encodeURIPath(slug.trim())}.html`
	}

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

/** A player's in-game profile, from their Granblue ID */
export function buildGranblueProfileUrl(
	granblueId: string | number | undefined | null
): string | null {
	if (granblueId === undefined || granblueId === null || granblueId === '') return null
	return `https://game.granbluefantasy.jp/#profile/${granblueId}`
}

/** A gbf.wiki user page, from the wiki username */
const WIKI_USERNAME = /^[^#<>[\]|{}/:@\n]{1,85}$/
const WIKI_URL_PREFIX = /^(?:https?:\/\/)?(?:www\.)?gbf\.wiki\//i

/**
 * A gbf.wiki username as the API stores it: the name only. Takes the name,
 * "User:Name", or the user page's URL (including index.php?title=). Mirrors
 * WikiProfile in hensei-api. Returns null for a blank value and false for
 * one that isn't a username (another page, or characters MediaWiki forbids).
 */
export function wikiProfileName(typed: string | undefined | null): string | null | false {
	const value = (typed ?? '').trim()
	if (!value) return null
	let name = value
	if (WIKI_URL_PREFIX.test(value)) {
		const rest = value.replace(WIKI_URL_PREFIX, '')
		const title = rest.startsWith('index.php')
			? new URLSearchParams(rest.split('?')[1] ?? '').get('title')
			: safeDecode(rest.split(/[?#]/)[0] ?? '')
		if (!title || !/^User:/i.test(title)) return false
		name = title.replace(/\/$/, '')
	}
	name = name.replace(/^User:/i, '').trim()
	return WIKI_USERNAME.test(name) ? name : false
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

/** What the wiki field shows while typing: a pasted user page URL becomes its username */
export function wikiFieldValue(typed: string): string {
	if (!WIKI_URL_PREFIX.test(typed.trim()) && !/^User:/i.test(typed.trim())) return typed
	return wikiProfileName(typed) || typed
}

/** A gbf.wiki user page, from the stored username (or anything wikiProfileName reads) */
export function buildWikiProfileUrl(wikiProfile: string | undefined | null): string | null {
	const name = wikiProfileName(wikiProfile)
	return name ? `https://gbf.wiki/User:${encodeURIComponent(name)}` : null
}

const YOUTUBE_HANDLE = '[A-Za-z0-9._-]{1,100}'
const YOUTUBE_CHANNEL_ID = 'UC[A-Za-z0-9_-]{22}'
const YOUTUBE_URL_PREFIX = /^(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\//i

/**
 * A YouTube channel as the API stores it: "@handle", or "channel/UC…" for a
 * channel linked by its ID. Takes a handle with or without the @, or the
 * channel's URL. Mirrors YoutubeChannel in hensei-api. Returns null for a
 * blank value and false for one that isn't a channel.
 */
export function youtubeChannel(typed: string | undefined | null): string | null | false {
	const value = (typed ?? '').trim()
	if (!value) return null
	if (YOUTUBE_URL_PREFIX.test(value)) {
		const path = value.replace(YOUTUBE_URL_PREFIX, '').split(/[?#]/)[0] ?? ''
		const handle = path.match(new RegExp(`^@(${YOUTUBE_HANDLE})(?:/|$)`))
		if (handle) return `@${handle[1]}`
		const channel = path.match(new RegExp(`^channel/(${YOUTUBE_CHANNEL_ID})(?:/|$)`))
		if (channel) return `channel/${channel[1]}`
		return false
	}
	// Already stored by its channel ID
	if (new RegExp(`^channel/${YOUTUBE_CHANNEL_ID}$`).test(value)) return value
	const handle = value.replace(/^@/, '')
	return new RegExp(`^${YOUTUBE_HANDLE}$`).test(handle) ? `@${handle}` : false
}

/**
 * What the YouTube field shows while typing: a pasted or typed channel URL
 * becomes its handle; anything else is left as typed
 */
export function youtubeFieldValue(typed: string): string {
	if (!YOUTUBE_URL_PREFIX.test(typed.trim())) return typed
	return youtubeChannel(typed) || typed
}

/** A YouTube channel's page, from its stored value (or anything youtubeChannel reads) */
export function buildYoutubeChannelUrl(value: string | undefined | null): string | null {
	const channel = youtubeChannel(value)
	// "@handle" and "channel/UC…" are both paths on youtube.com
	return channel ? `https://www.youtube.com/${channel}` : null
}
