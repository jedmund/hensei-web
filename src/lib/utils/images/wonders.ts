/**
 * Wonder images: `wonders/square/<image>.jpg`, 130×130, and the bonus icons
 * in `wonders/bonuses/`. The API's `image` field
 * names the file (`9008_20` for a level 20 Seal, `9015_10` for Symbolum).
 */

import { BUCKET, getBasePath } from '$lib/utils/images/core'

export function getWonderImage(image: string): string {
	return `${getBasePath()}/${BUCKET.wonders}/${image}.jpg`
}

/** A bonus line's icon, by the game's id (`bonus_8`), cut from its sprite. */
export function getWonderBonusIcon(icon: string): string {
	return `${getBasePath()}/${BUCKET.wonderBonuses}/${icon}.png`
}
