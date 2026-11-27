/**
 * Client side of the gacha simulator's share images: the image URL for a
 * result link. Copying it is in shareImage.ts.
 */

export interface GachaImageOptions {
	art: 'weapon' | 'character'
	currency: 'usd' | 'jpy' | 'crystals'
	lang: 'en' | 'ja'
}

/** Image URL for a result link's query string (settings plus seed). */
export function gachaImageUrl(query: string, opts: GachaImageOptions): string {
	const params = new URLSearchParams(query)
	params.set('art', opts.art)
	params.set('currency', opts.currency)
	params.set('lang', opts.lang)
	return `/download/gacha?${params.toString()}`
}
