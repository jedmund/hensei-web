/**
 * The thumbnail for a "Recently opened" entry, from its stored path alone
 * (entries keep no image). Characters, weapons, summons, accessories and
 * bullets route by their game id, so their square art can be found; other
 * records get null and show a neutral tile.
 */
import { getCharacterImage } from '$lib/utils/images/characters'
import { getAccessoryImage, getBulletImage } from '$lib/utils/images/equipment'
import { getSummonImage } from '$lib/utils/images/summons'
import { getWeaponImage } from '$lib/utils/images/weapons'
import { delocalize } from './sections'

const IMAGES: Record<string, (granblueId: string) => string> = {
	characters: (id) => getCharacterImage(id, 'square', '01'),
	weapons: (id) => getWeaponImage(id, 'square'),
	summons: (id) => getSummonImage(id, 'square'),
	'job-accessories': (id) => getAccessoryImage(id, 'square'),
	bullets: (id) => getBulletImage(id)
}

export function recentImage(path: string): string | null {
	const match = /^\/database\/([^/]+)\/([^/?#]+)/.exec(delocalize(path))
	if (!match) return null
	const [, resource, id] = match
	const image = resource ? IMAGES[resource] : undefined
	return image && id ? image(decodeURIComponent(id)) : null
}
