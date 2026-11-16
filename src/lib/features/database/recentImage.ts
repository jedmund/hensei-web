/**
 * The thumbnail for a "Recently opened" entry, from its stored path alone
 * (entries keep no image). Characters, weapons, summons, accessories and
 * bullets route by their game id, so their square art can be found; users
 * show their avatar (see `recentUserId`); other records get null and show a
 * neutral tile.
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

/** The resource and record id a record path names */
function parse(path: string): { resource: string; id: string } | null {
	const match = /^\/database\/([^/]+)\/([^/?#]+)/.exec(delocalize(path))
	return match?.[1] && match[2] ? { resource: match[1], id: decodeURIComponent(match[2]) } : null
}

export function recentImage(path: string): string | null {
	const record = parse(path)
	const image = record ? IMAGES[record.resource] : undefined
	return record && image ? image(record.id) : null
}

/** The user a path opens, whose avatar stands in for an image */
export function recentUserId(path: string): string | null {
	const record = parse(path)
	return record?.resource === 'users' ? record.id : null
}
