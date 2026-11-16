/**
 * The series icon in a series resource's list and detail header. Series
 * without an icon (Gacha and Event weapons) show none, and an icon that
 * fails to load hides itself.
 */
import type { DataTableColumn } from '$lib/components/data-table/types'
import {
	getSummonSeriesIcon,
	getWeaponSeriesIcon,
	hasWeaponSeriesIcon
} from '$lib/utils/images/icons'

/** A series' icon URL, or undefined when the game has none */
export type SeriesIcon = (slug: string) => string | undefined

export const weaponSeriesIcon: SeriesIcon = (slug) =>
	hasWeaponSeriesIcon(slug) ? getWeaponSeriesIcon(slug) : undefined

export const summonSeriesIcon: SeriesIcon = (slug) => getSummonSeriesIcon(slug)

/** The list's leading icon column */
export function seriesIconColumn<Row extends { slug: string }>(
	icon: SeriesIcon
): DataTableColumn<Row> {
	return {
		id: 'icon',
		header: '',
		type: 'image',
		image: (row) => {
			const src = icon(row.slug)
			return src ? { src } : null
		},
		sortable: false,
		hideable: false,
		width: '88px',
		minWidth: '88px'
	}
}
