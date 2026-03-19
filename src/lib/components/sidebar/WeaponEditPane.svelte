<script lang="ts">
	/**
	 * WeaponEditPane - Edit component for collection weapons
	 *
	 * Provides edit controls for weapon customization:
	 * - Uncap level (editable UncapIndicator)
	 * - Transcendence step
	 * - Element (for element-changeable weapons)
	 * - Weapon keys (for Opus, Ultima, Draconic, Astral, Superlative)
	 * - AX skills (for weapons with AX support)
	 * - Awakening (for weapons with awakening support)
	 */
	import * as m from '$lib/paraglide/messages'
	import type { Weapon, Awakening, Bullet, BulletLoadout } from '$lib/types/api/entities'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import type { AugmentSkill, Befoulment } from '$lib/types/api/weaponStatModifier'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import WeaponKeySelect from '$lib/components/sidebar/edit/WeaponKeySelect.svelte'
	import AwakeningSelect from '$lib/components/sidebar/edit/AwakeningSelect.svelte'
	import AxSkillSelect from '$lib/components/sidebar/edit/AxSkillSelect.svelte'
	import BefoulmentSelect from '$lib/components/sidebar/edit/BefoulmentSelect.svelte'
	import BulletSelect from '$lib/components/sidebar/edit/BulletSelect.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { seriesHasWeaponKeys, seriesHasAwakening, getSeriesSlug } from '$lib/utils/weaponSeries'

	export interface WeaponEditValues {
		uncapLevel: number
		transcendenceStep: number
		element?: number
		weaponKey1Id?: string
		weaponKey2Id?: string
		weaponKey3Id?: string
		awakening?: {
			type?: Awakening
			level: number
		} | null
		axSkills: AugmentSkill[]
		befoulment?: Befoulment | null
		bullets?: BulletLoadout[]
	}

	export interface WeaponEditUpdates {
		uncapLevel?: number
		transcendenceStep?: number
		element?: number
		weaponKey1Id?: string
		weaponKey2Id?: string
		weaponKey3Id?: string
		weaponKey4Id?: string
		awakening?: {
			id: string
			level: number
		} | null
		axModifier1Id?: string
		axStrength1?: number
		axModifier2Id?: string
		axStrength2?: number
		befoulmentModifierId?: string
		befoulmentStrength?: number
		exorcismLevel?: number
		bullets?: BulletLoadout[]
	}

	interface Props {
		/** The base weapon data */
		weaponData: Weapon | undefined
		/** Current values for all edit fields */
		currentValues: WeaponEditValues
		/** Grid position (-1 = mainhand). Bullets only available on mainhand guns. */
		position?: number
		/** Callback when save is clicked */
		onSave?: (updates: WeaponEditUpdates) => void
	}

	let { weaponData, currentValues, position, onSave }: Props = $props()

	// Local state derived from props — overrides are temporary until currentValues changes
	let uncapLevel = $derived(currentValues.uncapLevel)
	let transcendenceStep = $derived(currentValues.transcendenceStep)
	let element = $derived(currentValues.element ?? weaponData?.element ?? 0)
	let weaponKey1 = $derived<string | undefined>(currentValues.weaponKey1Id)
	let weaponKey2 = $derived<string | undefined>(currentValues.weaponKey2Id)
	let weaponKey3 = $derived<string | undefined>(currentValues.weaponKey3Id)
	let selectedAwakening = $derived<Awakening | undefined>(currentValues.awakening?.type)
	let awakeningLevel = $derived(currentValues.awakening?.level ?? 1)
	let axSkills = $derived<AugmentSkill[]>(currentValues.axSkills ?? [])
	let befoulment = $derived<Befoulment | null>(currentValues.befoulment ?? null)
	let bulletSelections = $state<Map<number, Bullet | undefined>>(new Map())

	// Initialize bullet selections from current values
	$effect(() => {
		const newSelections = new Map<number, Bullet | undefined>()
		for (const entry of currentValues.bullets ?? []) {
			newSelections.set(entry.position, entry.bullet)
		}
		bulletSelections = newSelections
	})

	// Derived conditions
	const canChangeElement = $derived(weaponData?.element === 0)
	const series = $derived(weaponData?.series)
	const seriesSlug = $derived(getSeriesSlug(series))

	// Check if series has weapon keys using the utility (handles both formats)
	const hasWeaponKeys = $derived(seriesHasWeaponKeys(series))
	const keySlotCount = $derived(series?.numWeaponKeys ?? 0)

	// Augment type from series determines AX skills vs befoulment
	const augmentType = $derived(series?.augmentType ?? 'no_augment')
	const hasAxSkills = $derived(augmentType === 'ax')
	const hasBefoulment = $derived(augmentType === 'befoulment')
	const hasAwakening = $derived(seriesHasAwakening(series) && (weaponData?.maxAwakeningLevel ?? 0) > 0)
	const bulletSlots = $derived(weaponData?.bulletSlots ?? [])
	const isMainhand = $derived(position === -1)
	const hasBullets = $derived(bulletSlots.length > 0 && isMainhand && weaponData?.proficiency === 9)
	const availableAwakenings = $derived(weaponData?.awakenings ?? [])

	// Element name for theming
	const weaponElement = $derived(element || weaponData?.element)
	const elementName = $derived(weaponElement ? getElementKey(weaponElement) : undefined)

	function handleUncapUpdate(newLevel: number) {
		uncapLevel = newLevel
	}

	function handleTranscendenceUpdate(newStage: number) {
		transcendenceStep = newStage
	}

	// Export save function so parent can call it from header button
	export function save() {
		const updates: WeaponEditUpdates = {
			uncapLevel,
			transcendenceStep
		}

		// Element for element-changeable weapons
		if (canChangeElement) {
			updates.element = element
		}

		// Weapon keys
		if (hasWeaponKeys) {
			if (weaponKey1) updates.weaponKey1Id = weaponKey1
			if (weaponKey2) updates.weaponKey2Id = weaponKey2
			if (weaponKey3) updates.weaponKey3Id = weaponKey3
		}

		// Awakening
		if (hasAwakening) {
			if (selectedAwakening?.id) {
				updates.awakening = {
					id: selectedAwakening.id,
					level: awakeningLevel
				}
			} else {
				updates.awakening = null
			}
		}

		// AX Skills
		if (hasAxSkills) {
			if (axSkills[0]?.modifier?.id) {
				updates.axModifier1Id = axSkills[0].modifier.id
				updates.axStrength1 = axSkills[0].strength
			}
			if (axSkills[1]?.modifier?.id) {
				updates.axModifier2Id = axSkills[1].modifier.id
				updates.axStrength2 = axSkills[1].strength
			}
		}

		// Befoulment
		if (hasBefoulment) {
			if (befoulment?.modifier?.id) {
				updates.befoulmentModifierId = befoulment.modifier.id
				updates.befoulmentStrength = befoulment.strength
				updates.exorcismLevel = befoulment.exorcismLevel
			}
		}

		// Bullets
		if (hasBullets) {
			const loadout: BulletLoadout[] = []
			for (const [pos, bullet] of bulletSelections) {
				if (bullet) {
					loadout.push({ position: pos, bullet })
				}
			}
			updates.bullets = loadout
		}

		onSave?.(updates)
	}
</script>

<div class="weapon-edit-pane">
	<div class="edit-sections">
		<DetailsSection title={m.section_uncap_level()}>
			<div class="section-content uncap-section">
				<UncapIndicator
					type="weapon"
					{uncapLevel}
					transcendenceStage={transcendenceStep}
					flb={weaponData?.uncap?.flb}
					ulb={weaponData?.uncap?.ulb}
					transcendence={weaponData?.uncap?.transcendence}
					editable={true}
					updateUncap={handleUncapUpdate}
					updateTranscendence={handleTranscendenceUpdate}
				/>
			</div>
		</DetailsSection>

		{#if canChangeElement}
			<DetailsSection title={m.details_element()}>
				<div class="section-content">
					<ElementPicker
						bind:value={element}
						mode="segmented"
						contained
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasWeaponKeys}
			<DetailsSection title={m.details_weapon_keys()}>
				<div class="section-content key-selects">
					{#if keySlotCount >= 1}
						<WeaponKeySelect
							{seriesSlug}
							slot={0}
							bind:value={weaponKey1}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 2}
						<WeaponKeySelect
							{seriesSlug}
							slot={1}
							bind:value={weaponKey2}
							{transcendenceStep}
						/>
					{/if}
					{#if keySlotCount >= 3}
						<WeaponKeySelect
							{seriesSlug}
							slot={2}
							bind:value={weaponKey3}
							{transcendenceStep}
						/>
					{/if}
				</div>
			</DetailsSection>
		{/if}

		{#if hasAxSkills}
			<DetailsSection title={m.details_ax_skills()}>
				<div class="section-content">
					<AxSkillSelect
						bind:currentSkills={axSkills}
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasBefoulment}
			<DetailsSection title={m.details_befoulment()}>
				<div class="section-content">
					<BefoulmentSelect
						bind:currentBefoulment={befoulment}
						maxExorcismLevel={weaponData?.maxExorcismLevel}
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasAwakening && availableAwakenings.length > 0}
			<DetailsSection title={m.details_awakening()}>
				<div class="section-content">
					<AwakeningSelect
						awakenings={availableAwakenings}
						value={selectedAwakening}
						level={awakeningLevel}
						maxLevel={weaponData?.maxAwakeningLevel ?? 9}
						onAwakeningChange={(awakening) => {
							selectedAwakening = awakening
						}}
						onLevelChange={(level) => {
							awakeningLevel = level
						}}
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if hasBullets}
			<DetailsSection title="Bullets">
				<div class="section-content bullet-selects">
					{#each bulletSlots as slotType, i}
						<div class="bullet-slot">
							<span class="bullet-slot-label">{BULLET_TYPES[slotType] ?? 'Unknown'}</span>
							<BulletSelect
								bulletType={slotType}
								value={bulletSelections.get(i)?.id}
								onchange={(bullet) => {
									const updated = new Map(bulletSelections)
									if (bullet) {
										updated.set(i, bullet)
									} else {
										updated.delete(i)
									}
									bulletSelections = updated
								}}
							/>
						</div>
					{/each}
				</div>
			</DetailsSection>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.weapon-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.edit-sections {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		overflow-y: auto;
	}

	.section-content {
		padding: spacing.$unit;
	}

	.key-selects,
	.bullet-selects {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.bullet-slot {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.bullet-slot-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-weight: typography.$medium;
	}
</style>
