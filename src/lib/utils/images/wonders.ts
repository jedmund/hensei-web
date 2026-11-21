/**
 * Wonder images: `wonders/<image>.jpg`, 130×130. The API's `image` field
 * names the file (`9008_20` for a level 20 Seal, `9015_10` for Symbolum).
 */

import { BUCKET, getBasePath } from '$lib/utils/images/core'

export function getWonderImage(image: string): string {
	return `${getBasePath()}/${BUCKET.wonders}/${image}.jpg`
}
