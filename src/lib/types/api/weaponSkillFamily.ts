/**
 * Weapon-skill family types — the modifier-keyed aggregates the grid damage
 * calculator resolves values through, served by /weapon_skill_families.
 */

export interface WeaponSkillFamilySummary {
	modifier: string
	displayName: { en?: string | null; ja?: string | null } | null
	boostTypes: string[]
	series: string[]
	sizes: string[]
	formulaTypes: string[]
	counts: { dataRows: number; effectRows: number; versions: number; weapons: number }
	manuallyEdited: boolean
}

export interface WeaponSkillDatumRow {
	id: string
	modifier: string
	boostType: string
	series?: string | null
	size?: string | null
	formulaType?: string | null
	sl1?: number | null
	sl10?: number | null
	sl15?: number | null
	sl20?: number | null
	sl25?: number | null
	coefficient?: number | null
	maxValue?: number | null
	auraBoostable?: boolean | null
	weaponSkillVersionId?: string | null
	manuallyEditedAt?: string | null
}

export interface WeaponSkillEffectRow {
	id: string
	modifier: string
	boostType: string
	series?: string | null
	scalingKind: string
	value?: number | null
	valueUnit?: string | null
	perCopyCap?: number | null
	totalCap?: number | null
	sharedCapGroup?: string | null
	capFormula?: string | null
	countBasis?: string | null
	countCap?: number | null
	condition?: Record<string, unknown> | null
	targetInstance?: string | null
	auraBoostable?: boolean | null
	stacking?: string | null
	appliesTo?: string | null
	notes?: string | null
	keySlug?: string | null
	frameRule?: string | null
	weaponSkillVersionId?: string | null
	manuallyEditedAt?: string | null
	/** canonical | key | version */
	source: string
}

export interface FamilyVersion {
	id: string
	skillId: string
	name: { en?: string | null; ja?: string | null }
	description: { en?: string | null; ja?: string | null }
	iconStem?: string | null
	ordinal: number
	minUncap?: number | null
	transcendenceStage?: number | null
	skillModifier?: string | null
	skillSeries?: string | null
	skillSize?: string | null
	mainHandOnly?: boolean
	mcOnly?: boolean
	scalesWithSkillLevel?: boolean
	weapon?: { granblueId: string; nameEn: string; element?: number } | null
}

export interface FamilyKey {
	id: string
	nameEn?: string
	nameJp?: string
	name?: { en?: string; ja?: string }
	slug: string
}

export interface WeaponSkillFamily {
	modifier: string
	displayName: { en?: string | null; ja?: string | null }
	iconStem?: string | null
	data: WeaponSkillDatumRow[]
	effects: WeaponSkillEffectRow[]
	versions: FamilyVersion[]
	keys: FamilyKey[]
	usage: { versionCount: number; weaponCount: number }
}

/** Blast-radius payload returned by guarded deletes (409) */
export interface DeleteImpact {
	error?: string
	affectedVersions: number
	affectedWeapons: number
	sampleWeapons: string[]
	deleted?: boolean
}

export interface PanelValidation {
	ok: boolean
	panels: Array<{
		party: string
		capturedOn?: string
		ok: boolean
		mismatches: Array<{ label: string; ours: number | null; expected: number | string }>
	}>
}
