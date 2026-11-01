/**
 * Summon art and alternate-art transformations
 */

import {
	getBasePath,
	getFileExtension,
	getImageDirectory,
	getImageUrl,
	getPlaceholderImage,
	type ImageVariant,
	type TransformationStage
} from '$lib/utils/images/core'

/**
 * Summon IDs that have alternate art, mapped to the uncap level at which the first art upgrade occurs.
 *
 * All summons in this map follow the same 3-tier art progression:
 *   '02' — first upgrade (at the per-summon threshold below)
 *   '03' — second upgrade (uncap_level 6)
 *   '04' — third upgrade (uncap_level 6 + transcendence_step 5)
 *
 * Omega summons (Tiamat, Colossus, etc.) upgrade first at FLB (uncap 4).
 * Primal summons (Agni, Varuna, etc.) upgrade first at ULB (uncap 5).
 */
const SUMMON_ALT_ART_THRESHOLD: Map<string, number> = new Map([
	// Primal summons — first upgrade at uncap 5
	['2040094000', 5], // Agni
	['2040100000', 5], // Varuna
	['2040080000', 5], // Zeus
	['2040098000', 5], // Zephyrus
	['2040090000', 5], // Hades
	['2040084000', 5], // Titan
	['2040003000', 5], // Bahamut
	['2040056000', 5], // Lucifer
	['2040065000', 5],
	// Omega summons — first upgrade at uncap 4
	['2040020000', 4], // Tiamat Omega
	['2040034000', 4], // Colossus Omega
	['2040028000', 4], // Leviathan Omega
	['2040027000', 4], // Yggdrasil Omega
	['2040046000', 4], // Celeste Omega
	['2040047000', 4], // Luminiera Omega
	['2040430000', 4]
])

/**
 * Returns the list of available transformation stages for a summon.
 * Uses the SUMMON_ALT_ART_THRESHOLD map to determine which stages exist
 * and what to label the first art upgrade (FLB vs ULB).
 *
 * Summons whose series only ships ULB art (see {@link seriesHasUlbArt}) get
 * Base and ULB only; pass that result as `hasUlbArt`.
 */
export function getSummonTransformationStages(
	granblueId?: string | number | null,
	hasUlbArt?: boolean
): TransformationStage[] {
	const stages: TransformationStage[] = [{ id: '01', label: 'Base', suffix: undefined }]

	if (hasUlbArt) {
		stages.push({ id: '02', label: 'ULB', suffix: '02' })
		return stages
	}

	const id = String(granblueId)
	const threshold = granblueId ? SUMMON_ALT_ART_THRESHOLD.get(id) : undefined
	if (threshold === undefined) return stages

	const firstLabel = threshold <= 4 ? 'FLB' : 'ULB'
	stages.push({ id: '02', label: firstLabel, suffix: '02' })
	stages.push(
		{ id: '03', label: 'Transcendence (1)', suffix: '03' },
		{ id: '04', label: 'Transcendence (5)', suffix: '04' }
	)

	return stages
}

/**
 * Calculates the summon transformation suffix based on uncap level and transcendence.
 * Returns undefined for base art, '02' for first upgrade, '03' for uncap 6, '04' for uncap 6 + transcendence 5.
 * The first upgrade threshold varies per summon (see SUMMON_ALT_ART_THRESHOLD).
 *
 * Summons whose series only ships ULB art (see {@link seriesHasUlbArt}) return
 * '02' from uncap 5 and never a transcendence suffix; pass that result as `hasUlbArt`.
 */
export function getSummonTransformation(
	granblueId?: string | number | null,
	uncapLevel?: number,
	transcendenceStep?: number,
	hasUlbArt?: boolean
): string | undefined {
	if (hasUlbArt) return uncapLevel !== undefined && uncapLevel >= 5 ? '02' : undefined

	const id = String(granblueId)
	const threshold = granblueId ? SUMMON_ALT_ART_THRESHOLD.get(id) : undefined
	if (threshold === undefined) return undefined
	if (
		uncapLevel !== undefined &&
		uncapLevel >= 6 &&
		transcendenceStep !== undefined &&
		transcendenceStep >= 5
	)
		return '04'
	if (uncapLevel !== undefined && uncapLevel >= 6) return '03'
	if (uncapLevel !== undefined && uncapLevel >= threshold) return '02'
	return undefined
}

/**
 * Get summon image URL
 * @param transformation - Optional transformation suffix ('02' for ULB, '03' for transcendence)
 */
export function getSummonImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	transformation?: string
): string {
	if (!id) {
		return getPlaceholderImage('summon', variant)
	}

	const directory = getImageDirectory('summon', variant)
	const extension = getFileExtension('summon', variant)
	const basePath = `${getBasePath()}/${directory}`

	// Handle transformation suffix (ULB, transcendence)
	if (transformation) {
		return `${basePath}/${id}_${transformation}${extension}`
	}

	return `${basePath}/${id}${extension}`
}

/**
 * Get summon detail image (PNG)
 * @param transformation - Optional transformation suffix ('02' FLB/ULB, '03'/'04' transcendence)
 */
export function getSummonDetailImage(
	id: string | number | null | undefined,
	transformation?: string
): string {
	if (!id) return getPlaceholderImage('summon', 'detail')
	if (!transformation) return getImageUrl('summon', id, 'detail')
	const directory = getImageDirectory('summon', 'detail')
	const extension = getFileExtension('summon', 'detail')
	return `${getBasePath()}/${directory}/${id}_${transformation}${extension}`
}

/**
 * Get summon gacha card art (transparent PNG shown when the summon is drawn).
 * Not every summon has it; most R summons don't.
 * @param transformation - Optional transformation suffix ('02' where alternate art exists)
 */
export function getSummonGachaImage(
	id: string | number | null | undefined,
	transformation?: string
): string {
	if (!id) return getPlaceholderImage('summon', 'gacha')
	if (!transformation) return getImageUrl('summon', id, 'gacha')
	const directory = getImageDirectory('summon', 'gacha')
	const extension = getFileExtension('summon', 'gacha')
	return `${getBasePath()}/${directory}/${id}_${transformation}${extension}`
}

/**
 * Get summon wide image
 */
export function getSummonWideImage(id: string | number | null | undefined): string {
	return getImageUrl('summon', id, 'wide')
}
