import { localizedName } from '$lib/utils/locale'
import type { RaidFull } from '$lib/types/api/raid'

/**
 * A raid's name where its group is already shown (Home's raid tabs, the raid
 * picker): the short name ("Lv200" under "Exo Diablo Crucible") when it has
 * one, else its name.
 */
export function raidShortName(raid: Pick<RaidFull, 'name' | 'shortName'>): string {
	const short = raid.shortName
	return short && (short.en || short.ja) ? localizedName(short) : localizedName(raid.name)
}
