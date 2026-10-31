/**
 * Entity Adapter
 *
 * Facade over the per-entity adapters for canonical game data and its
 * editor endpoints. Each method forwards to the adapter that owns it:
 * weapon, character, summon, weaponSkill, series, bullet and awakening.
 * New code can import those adapters directly.
 *
 * @module adapters/entity
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { AdapterOptions } from './types'
import { WeaponAdapter } from './weapon.adapter'
import { CharacterAdapter } from './character.adapter'
import { SummonAdapter } from './summon.adapter'
import { WeaponSkillAdapter } from './weaponSkill.adapter'
import { SeriesAdapter } from './series.adapter'
import { BulletAdapter } from './bullet.adapter'
import { AwakeningAdapter } from './awakening.adapter'

export type {
	Weapon,
	WeaponKey,
	WeaponKeyQueryParams,
	WeaponValidationResult,
	CreateWeaponPayload,
	WeaponDownloadStatus,
	ParsedWeaponData
} from './weapon.adapter'
export type {
	Character,
	CharacterValidationResult,
	CreateCharacterPayload,
	CharacterDownloadStatus,
	ParsedCharacterData
} from './character.adapter'
export type {
	Summon,
	SummonValidationResult,
	CreateSummonPayload,
	SummonDownloadStatus,
	ParsedSummonData
} from './summon.adapter'
export type { BulletPayload } from './bullet.adapter'
export type { CreateAwakeningPayload, UpdateAwakeningPayload } from './awakening.adapter'
export type { EntityRawData, BatchPreviewResult, BatchPreviewResponse } from './entity.shared'

/**
 * Entity adapter for accessing canonical game data
 */
export class EntityAdapter extends BaseAdapter {
	private readonly weapons: WeaponAdapter
	private readonly characters: CharacterAdapter
	private readonly summons: SummonAdapter
	private readonly weaponSkills: WeaponSkillAdapter
	private readonly series: SeriesAdapter
	private readonly bullets: BulletAdapter
	private readonly awakenings: AwakeningAdapter

	constructor(options: AdapterOptions = {}) {
		super(options)
		this.weapons = new WeaponAdapter(this.options)
		this.characters = new CharacterAdapter(this.options)
		this.summons = new SummonAdapter(this.options)
		this.weaponSkills = new WeaponSkillAdapter(this.options)
		this.series = new SeriesAdapter(this.options)
		this.bullets = new BulletAdapter(this.options)
		this.awakenings = new AwakeningAdapter(this.options)
	}

	// Weapons (weapon.adapter)

	getWeapon(...args: Parameters<WeaponAdapter['getWeapon']>) {
		return this.weapons.getWeapon(...args)
	}

	getWeapons(...args: Parameters<WeaponAdapter['getWeapons']>) {
		return this.weapons.getWeapons(...args)
	}

	getWeaponKeys(...args: Parameters<WeaponAdapter['getWeaponKeys']>) {
		return this.weapons.getWeaponKeys(...args)
	}

	updateWeaponKey(...args: Parameters<WeaponAdapter['updateWeaponKey']>) {
		return this.weapons.updateWeaponKey(...args)
	}

	getWeaponStatModifiers(...args: Parameters<WeaponAdapter['getWeaponStatModifiers']>) {
		return this.weapons.getWeaponStatModifiers(...args)
	}

	getAxSkills(...args: Parameters<WeaponAdapter['getAxSkills']>) {
		return this.weapons.getAxSkills(...args)
	}

	getBefoulments(...args: Parameters<WeaponAdapter['getBefoulments']>) {
		return this.weapons.getBefoulments(...args)
	}

	validateWeaponGranblueId(...args: Parameters<WeaponAdapter['validateWeaponGranblueId']>) {
		return this.weapons.validateWeaponGranblueId(...args)
	}

	createWeapon(...args: Parameters<WeaponAdapter['createWeapon']>) {
		return this.weapons.createWeapon(...args)
	}

	updateWeapon(...args: Parameters<WeaponAdapter['updateWeapon']>) {
		return this.weapons.updateWeapon(...args)
	}

	downloadWeaponImages(...args: Parameters<WeaponAdapter['downloadWeaponImages']>) {
		return this.weapons.downloadWeaponImages(...args)
	}

	downloadWeaponImage(...args: Parameters<WeaponAdapter['downloadWeaponImage']>) {
		return this.weapons.downloadWeaponImage(...args)
	}

	getWeaponDownloadStatus(...args: Parameters<WeaponAdapter['getWeaponDownloadStatus']>) {
		return this.weapons.getWeaponDownloadStatus(...args)
	}

	getWeaponRawData(...args: Parameters<WeaponAdapter['getWeaponRawData']>) {
		return this.weapons.getWeaponRawData(...args)
	}

	fetchWeaponWiki(...args: Parameters<WeaponAdapter['fetchWeaponWiki']>) {
		return this.weapons.fetchWeaponWiki(...args)
	}

	reparseWeapon(...args: Parameters<WeaponAdapter['reparseWeapon']>) {
		return this.weapons.reparseWeapon(...args)
	}

	batchPreviewWeapons(...args: Parameters<WeaponAdapter['batchPreviewWeapons']>) {
		return this.weapons.batchPreviewWeapons(...args)
	}

	// Characters (character.adapter)

	getCharacter(...args: Parameters<CharacterAdapter['getCharacter']>) {
		return this.characters.getCharacter(...args)
	}

	getRelatedCharacters(...args: Parameters<CharacterAdapter['getRelatedCharacters']>) {
		return this.characters.getRelatedCharacters(...args)
	}

	getCharacters(...args: Parameters<CharacterAdapter['getCharacters']>) {
		return this.characters.getCharacters(...args)
	}

	validateCharacterGranblueId(
		...args: Parameters<CharacterAdapter['validateCharacterGranblueId']>
	) {
		return this.characters.validateCharacterGranblueId(...args)
	}

	createCharacter(...args: Parameters<CharacterAdapter['createCharacter']>) {
		return this.characters.createCharacter(...args)
	}

	updateCharacter(...args: Parameters<CharacterAdapter['updateCharacter']>) {
		return this.characters.updateCharacter(...args)
	}

	downloadCharacterImages(...args: Parameters<CharacterAdapter['downloadCharacterImages']>) {
		return this.characters.downloadCharacterImages(...args)
	}

	downloadCharacterImage(...args: Parameters<CharacterAdapter['downloadCharacterImage']>) {
		return this.characters.downloadCharacterImage(...args)
	}

	getCharacterDownloadStatus(...args: Parameters<CharacterAdapter['getCharacterDownloadStatus']>) {
		return this.characters.getCharacterDownloadStatus(...args)
	}

	getCharacterRawData(...args: Parameters<CharacterAdapter['getCharacterRawData']>) {
		return this.characters.getCharacterRawData(...args)
	}

	fetchCharacterWiki(...args: Parameters<CharacterAdapter['fetchCharacterWiki']>) {
		return this.characters.fetchCharacterWiki(...args)
	}

	batchPreviewCharacters(...args: Parameters<CharacterAdapter['batchPreviewCharacters']>) {
		return this.characters.batchPreviewCharacters(...args)
	}

	// Summons (summon.adapter)

	getSummon(...args: Parameters<SummonAdapter['getSummon']>) {
		return this.summons.getSummon(...args)
	}

	getSummons(...args: Parameters<SummonAdapter['getSummons']>) {
		return this.summons.getSummons(...args)
	}

	validateSummonGranblueId(...args: Parameters<SummonAdapter['validateSummonGranblueId']>) {
		return this.summons.validateSummonGranblueId(...args)
	}

	createSummon(...args: Parameters<SummonAdapter['createSummon']>) {
		return this.summons.createSummon(...args)
	}

	updateSummon(...args: Parameters<SummonAdapter['updateSummon']>) {
		return this.summons.updateSummon(...args)
	}

	downloadSummonImages(...args: Parameters<SummonAdapter['downloadSummonImages']>) {
		return this.summons.downloadSummonImages(...args)
	}

	downloadSummonImage(...args: Parameters<SummonAdapter['downloadSummonImage']>) {
		return this.summons.downloadSummonImage(...args)
	}

	getSummonDownloadStatus(...args: Parameters<SummonAdapter['getSummonDownloadStatus']>) {
		return this.summons.getSummonDownloadStatus(...args)
	}

	getSummonRawData(...args: Parameters<SummonAdapter['getSummonRawData']>) {
		return this.summons.getSummonRawData(...args)
	}

	fetchSummonWiki(...args: Parameters<SummonAdapter['fetchSummonWiki']>) {
		return this.summons.fetchSummonWiki(...args)
	}

	reparseSummon(...args: Parameters<SummonAdapter['reparseSummon']>) {
		return this.summons.reparseSummon(...args)
	}

	batchPreviewSummons(...args: Parameters<SummonAdapter['batchPreviewSummons']>) {
		return this.summons.batchPreviewSummons(...args)
	}

	// Weapon skill families (weaponSkill.adapter)

	getWeaponSkillFamilies(...args: Parameters<WeaponSkillAdapter['getWeaponSkillFamilies']>) {
		return this.weaponSkills.getWeaponSkillFamilies(...args)
	}

	getWeaponSkillFamily(...args: Parameters<WeaponSkillAdapter['getWeaponSkillFamily']>) {
		return this.weaponSkills.getWeaponSkillFamily(...args)
	}

	createWeaponSkillDatum(...args: Parameters<WeaponSkillAdapter['createWeaponSkillDatum']>) {
		return this.weaponSkills.createWeaponSkillDatum(...args)
	}

	updateWeaponSkillDatum(...args: Parameters<WeaponSkillAdapter['updateWeaponSkillDatum']>) {
		return this.weaponSkills.updateWeaponSkillDatum(...args)
	}

	deleteWeaponSkillDatum(...args: Parameters<WeaponSkillAdapter['deleteWeaponSkillDatum']>) {
		return this.weaponSkills.deleteWeaponSkillDatum(...args)
	}

	createWeaponSkillEffect(...args: Parameters<WeaponSkillAdapter['createWeaponSkillEffect']>) {
		return this.weaponSkills.createWeaponSkillEffect(...args)
	}

	updateWeaponSkillEffect(...args: Parameters<WeaponSkillAdapter['updateWeaponSkillEffect']>) {
		return this.weaponSkills.updateWeaponSkillEffect(...args)
	}

	deleteWeaponSkillEffect(...args: Parameters<WeaponSkillAdapter['deleteWeaponSkillEffect']>) {
		return this.weaponSkills.deleteWeaponSkillEffect(...args)
	}

	updateWeaponSkillVersion(...args: Parameters<WeaponSkillAdapter['updateWeaponSkillVersion']>) {
		return this.weaponSkills.updateWeaponSkillVersion(...args)
	}

	updateSkillLabels(...args: Parameters<WeaponSkillAdapter['updateSkillLabels']>) {
		return this.weaponSkills.updateSkillLabels(...args)
	}

	validatePanels(...args: Parameters<WeaponSkillAdapter['validatePanels']>) {
		return this.weaponSkills.validatePanels(...args)
	}

	// Series (series.adapter)

	getWeaponSeriesList(...args: Parameters<SeriesAdapter['getWeaponSeriesList']>) {
		return this.series.getWeaponSeriesList(...args)
	}

	getWeaponSeries(...args: Parameters<SeriesAdapter['getWeaponSeries']>) {
		return this.series.getWeaponSeries(...args)
	}

	createWeaponSeries(...args: Parameters<SeriesAdapter['createWeaponSeries']>) {
		return this.series.createWeaponSeries(...args)
	}

	updateWeaponSeries(...args: Parameters<SeriesAdapter['updateWeaponSeries']>) {
		return this.series.updateWeaponSeries(...args)
	}

	deleteWeaponSeries(...args: Parameters<SeriesAdapter['deleteWeaponSeries']>) {
		return this.series.deleteWeaponSeries(...args)
	}

	clearWeaponSeriesCache(...args: Parameters<SeriesAdapter['clearWeaponSeriesCache']>) {
		return this.series.clearWeaponSeriesCache(...args)
	}

	createWeaponSeriesVariant(...args: Parameters<SeriesAdapter['createWeaponSeriesVariant']>) {
		return this.series.createWeaponSeriesVariant(...args)
	}

	updateWeaponSeriesVariant(...args: Parameters<SeriesAdapter['updateWeaponSeriesVariant']>) {
		return this.series.updateWeaponSeriesVariant(...args)
	}

	deleteWeaponSeriesVariant(...args: Parameters<SeriesAdapter['deleteWeaponSeriesVariant']>) {
		return this.series.deleteWeaponSeriesVariant(...args)
	}

	getCharacterSeriesList(...args: Parameters<SeriesAdapter['getCharacterSeriesList']>) {
		return this.series.getCharacterSeriesList(...args)
	}

	getCharacterSeries(...args: Parameters<SeriesAdapter['getCharacterSeries']>) {
		return this.series.getCharacterSeries(...args)
	}

	createCharacterSeries(...args: Parameters<SeriesAdapter['createCharacterSeries']>) {
		return this.series.createCharacterSeries(...args)
	}

	updateCharacterSeries(...args: Parameters<SeriesAdapter['updateCharacterSeries']>) {
		return this.series.updateCharacterSeries(...args)
	}

	deleteCharacterSeries(...args: Parameters<SeriesAdapter['deleteCharacterSeries']>) {
		return this.series.deleteCharacterSeries(...args)
	}

	clearCharacterSeriesCache(...args: Parameters<SeriesAdapter['clearCharacterSeriesCache']>) {
		return this.series.clearCharacterSeriesCache(...args)
	}

	getSummonSeriesList(...args: Parameters<SeriesAdapter['getSummonSeriesList']>) {
		return this.series.getSummonSeriesList(...args)
	}

	getSummonSeries(...args: Parameters<SeriesAdapter['getSummonSeries']>) {
		return this.series.getSummonSeries(...args)
	}

	createSummonSeries(...args: Parameters<SeriesAdapter['createSummonSeries']>) {
		return this.series.createSummonSeries(...args)
	}

	updateSummonSeries(...args: Parameters<SeriesAdapter['updateSummonSeries']>) {
		return this.series.updateSummonSeries(...args)
	}

	deleteSummonSeries(...args: Parameters<SeriesAdapter['deleteSummonSeries']>) {
		return this.series.deleteSummonSeries(...args)
	}

	clearSummonSeriesCache(...args: Parameters<SeriesAdapter['clearSummonSeriesCache']>) {
		return this.series.clearSummonSeriesCache(...args)
	}

	// Bullets (bullet.adapter)

	getBullets(...args: Parameters<BulletAdapter['getBullets']>) {
		return this.bullets.getBullets(...args)
	}

	getBulletById(...args: Parameters<BulletAdapter['getBulletById']>) {
		return this.bullets.getBulletById(...args)
	}

	createBullet(...args: Parameters<BulletAdapter['createBullet']>) {
		return this.bullets.createBullet(...args)
	}

	updateBullet(...args: Parameters<BulletAdapter['updateBullet']>) {
		return this.bullets.updateBullet(...args)
	}

	deleteBullet(...args: Parameters<BulletAdapter['deleteBullet']>) {
		return this.bullets.deleteBullet(...args)
	}

	downloadBulletImage(...args: Parameters<BulletAdapter['downloadBulletImage']>) {
		return this.bullets.downloadBulletImage(...args)
	}

	downloadBulletImages(...args: Parameters<BulletAdapter['downloadBulletImages']>) {
		return this.bullets.downloadBulletImages(...args)
	}

	getBulletDownloadStatus(...args: Parameters<BulletAdapter['getBulletDownloadStatus']>) {
		return this.bullets.getBulletDownloadStatus(...args)
	}

	// Awakenings (awakening.adapter)

	getAwakenings(...args: Parameters<AwakeningAdapter['getAwakenings']>) {
		return this.awakenings.getAwakenings(...args)
	}

	getAwakening(...args: Parameters<AwakeningAdapter['getAwakening']>) {
		return this.awakenings.getAwakening(...args)
	}

	createAwakening(...args: Parameters<AwakeningAdapter['createAwakening']>) {
		return this.awakenings.createAwakening(...args)
	}

	updateAwakening(...args: Parameters<AwakeningAdapter['updateAwakening']>) {
		return this.awakenings.updateAwakening(...args)
	}

	deleteAwakening(...args: Parameters<AwakeningAdapter['deleteAwakening']>) {
		return this.awakenings.deleteAwakening(...args)
	}

	uploadAwakeningImage(...args: Parameters<AwakeningAdapter['uploadAwakeningImage']>) {
		return this.awakenings.uploadAwakeningImage(...args)
	}

	/**
	 * Clears entity cache
	 */
	clearEntityCache(
		type?:
			| 'weapons'
			| 'characters'
			| 'summons'
			| 'weapon_keys'
			| 'weapon_series'
			| 'weapon_stat_modifiers'
	) {
		if (type) {
			this.clearCache(`/${type}`)
		} else {
			// Clear all entity caches
			this.clearCache('/weapons')
			this.clearCache('/characters')
			this.clearCache('/summons')
			this.clearCache('/weapon_keys')
			this.clearCache('/weapon_series')
			this.clearCache('/weapon_stat_modifiers')
		}
	}
}

/**
 * Default entity adapter instance
 */
export const entityAdapter = new EntityAdapter(DEFAULT_ADAPTER_CONFIG)
