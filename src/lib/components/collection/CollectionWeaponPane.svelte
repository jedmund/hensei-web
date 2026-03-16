<script lang="ts">
	/**
	 * CollectionWeaponPane - Details and edit pane for collection weapons
	 *
	 * Displays weapon information with two views:
	 * - "Info" tab: Shows base weapon stats, skills, etc.
	 * - "My Collection" tab: Shows user's customizations (element, keys, AX, awakening)
	 *
	 * The "My Collection" tab includes an edit mode using WeaponEditPane.
	 */
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import { localizedName } from '$lib/utils/locale'
	import type { CollectionWeapon } from '$lib/types/api/collection'
	import type { AugmentSkill, Befoulment } from '$lib/types/api/weaponStatModifier'
	import {
		useUpdateCollectionWeapon,
		useRemoveWeaponFromCollection
	} from '$lib/api/mutations/collection.mutations'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import ItemHeader from '$lib/components/sidebar/details/ItemHeader.svelte'
	import BasicInfoSection from '$lib/components/sidebar/details/BasicInfoSection.svelte'
	import StatsSection from '$lib/components/sidebar/details/StatsSection.svelte'
	import SkillsSection from '$lib/components/sidebar/details/SkillsSection.svelte'
	import WeaponEditPane, {
		type WeaponEditValues,
		type WeaponEditUpdates
	} from '$lib/components/collection/WeaponEditPane.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'
	import { getElementKey } from '$lib/utils/element'

	interface Props {
		weapon: CollectionWeapon
		isOwner: boolean
		onClose?: () => void
		paneId?: string
	}

	let { weapon: initialWeapon, isOwner, onClose, paneId }: Props = $props()

	// Local state for the weapon - updated when mutation succeeds
	let weapon = $state<CollectionWeapon>(initialWeapon)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Reference to the edit pane component for calling save()
	let editPaneRef: ReturnType<typeof WeaponEditPane> | undefined = $state()

	// Mutations
	const updateMutation = useUpdateCollectionWeapon()
	const deleteMutation = useRemoveWeaponFromCollection()

	// Derived values
	const weaponData = $derived(weapon.weapon)

	// Show instance element for element-changeable, otherwise show weapon's base element
	const displayElement = $derived(
		weaponData?.element === 0 ? weapon.element : weaponData?.element
	)

	// Current edit values from the collection weapon
	const currentValues = $derived<WeaponEditValues>({
		uncapLevel: weapon.uncapLevel,
		transcendenceStep: weapon.transcendenceStep,
		element: weapon.element,
		weaponKey1Id: weapon.weaponKeys?.[0]?.id,
		weaponKey2Id: weapon.weaponKeys?.[1]?.id,
		weaponKey3Id: weapon.weaponKeys?.[2]?.id,
		awakening: weapon.awakening
			? {
					type: weapon.awakening.type,
					level: weapon.awakening.level
				}
			: null,
		axSkills: (weapon.ax as AugmentSkill[]) ?? [],
		befoulment: (weapon.befoulment as Befoulment) ?? null
	})

	// Element name for theming
	const elementName = $derived(displayElement ? getElementKey(displayElement) : undefined)

	async function handleSave(updates: WeaponEditUpdates) {
		try {
			// Transform updates to API format
			const input: Record<string, unknown> = {}

			if (updates.uncapLevel !== undefined) {
				input.uncapLevel = updates.uncapLevel
			}

			if (updates.transcendenceStep !== undefined) {
				input.transcendenceStep = updates.transcendenceStep
			}

			if (updates.element !== undefined) {
				input.element = updates.element
			}

			// Weapon keys
			if (updates.weaponKey1Id !== undefined) {
				input.weaponKey1Id = updates.weaponKey1Id
			}
			if (updates.weaponKey2Id !== undefined) {
				input.weaponKey2Id = updates.weaponKey2Id
			}
			if (updates.weaponKey3Id !== undefined) {
				input.weaponKey3Id = updates.weaponKey3Id
			}

			// Awakening
			if (updates.awakening !== undefined) {
				if (updates.awakening === null) {
					input.awakeningId = null
					input.awakeningLevel = null
				} else {
					input.awakeningId = updates.awakening.id
					input.awakeningLevel = updates.awakening.level
				}
			}

			// AX skills
			if (updates.axModifier1Id !== undefined) {
				input.axModifier1Id = updates.axModifier1Id
				input.axStrength1 = updates.axStrength1
			}
			if (updates.axModifier2Id !== undefined) {
				input.axModifier2Id = updates.axModifier2Id
				input.axStrength2 = updates.axStrength2
			}

			// Befoulment
			if (updates.befoulmentModifierId !== undefined) {
				input.befoulmentModifierId = updates.befoulmentModifierId
				input.befoulmentStrength = updates.befoulmentStrength
				input.exorcismLevel = updates.exorcismLevel
			}

			const updatedWeapon = await updateMutation.mutateAsync({
				id: weapon.id,
				input
			})

			// Update local state with the response
			weapon = updatedWeapon

			isEditing = false
			updateActionVisibility()
		} catch (error) {
			console.error('Failed to update collection weapon:', error)
			toast.error(extractErrorMessage(error, 'Failed to update weapon'))
		}
	}

	// Enter edit mode and update header action
	function enterEditMode() {
		isEditing = true
		if (paneId) {
			sidebar.setActionForPane(paneId, () => editPaneRef?.save(), m.action_save(), elementName)
		}
	}

	// Handle delete from collection
	function handleDelete() {
		if (confirm(m.collection_remove_confirm_weapon())) {
			deleteMutation.mutate(weapon.id, {
				onSuccess: () => {
					onClose?.()
				}
			})
		}
	}

	// Update action visibility when tab or edit state changes
	function updateActionVisibility() {
		if (!paneId) return

		const dbMenuItem = canViewDatabase
			? { label: m.context_view_in_database(), handler: viewInDatabase }
			: undefined

		if (isOwner && selectedTab === 'collection') {
			if (isEditing) {
				sidebar.setActionForPane(paneId, () => editPaneRef?.save(), m.action_save(), elementName)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			} else {
				sidebar.setActionForPane(paneId, enterEditMode, m.action_edit(), elementName)
				const menuItems = [
					...(dbMenuItem ? [dbMenuItem] : []),
					{
						label: m.collection_remove_from(),
						handler: handleDelete,
						variant: 'danger' as const
					}
				]
				sidebar.setOverflowMenuForPane(paneId, menuItems)
			}
		} else {
			sidebar.setActionForPane(paneId, undefined)
			sidebar.setOverflowMenuForPane(paneId, dbMenuItem ? [dbMenuItem] : undefined)
		}
	}

	function handleCancel() {
		isEditing = false
		updateActionVisibility()
	}

	function handleTabChange(value: string) {
		selectedTab = value as 'info' | 'collection'
		if (isEditing) {
			isEditing = false
		}
		updateActionVisibility()
	}

	function getAwakeningType(): string {
		if (!weapon.awakening) return '—'
		return localizedName(weapon.awakening.type.name)
	}

	function getAwakeningLevel(): string {
		if (!weapon.awakening) return '—'
		return String(weapon.awakening.level)
	}

	function getWeaponKeyName(index: number): string {
		const key = weapon.weaponKeys?.[index]
		if (!key) return '—'
		return localizedName(key.name)
	}

	// Check conditions
	const hasAwakening = $derived(weapon.awakening !== null)
	const hasWeaponKeys = $derived((weapon.weaponKeys?.length ?? 0) > 0)
	const hasAxSkills = $derived((weapon.ax?.length ?? 0) > 0 && weapon.ax?.some(ax => ax.modifier?.id))
	const canChangeElement = $derived(weaponData?.element === 0)

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	function viewInDatabase() {
		if (!weaponData?.granblueId) return
		goto(getDatabaseUrl('weapon', weaponData.granblueId))
	}

	// Set up sidebar action on mount and clean up on destroy
	onMount(() => {
		updateActionVisibility()

		return () => {
			if (paneId) {
				sidebar.setActionForPane(paneId, undefined)
				sidebar.setOverflowMenuForPane(paneId, undefined)
			}
		}
	})
</script>

<div class="collection-weapon-pane">
	<ItemHeader
		type="weapon"
		item={weapon as any}
		itemData={weaponData}
		gridUncapLevel={weapon.uncapLevel}
		gridTranscendence={weapon.transcendenceStep}
	/>

	<div class="tab-nav">
		<SegmentedControl
			value={selectedTab}
			onValueChange={handleTabChange}
			variant="background"
			size="small"
			grow
		>
			<Segment value="info">{m.collection_pane_info()}</Segment>
			<Segment value="collection">{m.collection_pane_my_collection()}</Segment>
		</SegmentedControl>
	</div>

	<div class="pane-content">
		{#if selectedTab === 'info'}
			<div class="info-view">
				<BasicInfoSection type="weapon" itemData={weaponData} />
				<StatsSection
					itemData={weaponData}
					gridUncapLevel={weapon.uncapLevel}
					gridTranscendence={weapon.transcendenceStep}
				/>
				<SkillsSection type="weapon" itemData={weaponData} />
			</div>
		{:else if isEditing}
			<WeaponEditPane
				bind:this={editPaneRef}
				{weaponData}
				{currentValues}
				onSave={handleSave}
			/>
		{:else}
			<div class="collection-view">
				<DetailsSection title={m.section_general()}>
					<DetailRow label={m.label_uncap_level()}>
						<UncapIndicator
							type="weapon"
							uncapLevel={weapon.uncapLevel}
							transcendenceStage={weapon.transcendenceStep}
							flb={weaponData?.uncap?.flb}
							ulb={weaponData?.uncap?.ulb}
							transcendence={weaponData?.uncap?.transcendence}
						/>
					</DetailRow>
					{#if canChangeElement}
						<DetailRow label={m.label_element()}>
							<ElementLabel element={displayElement} size="medium" />
						</DetailRow>
					{/if}
				</DetailsSection>

				<DetailsSection title={m.details_awakening()} empty={!hasAwakening} emptyMessage={m.collection_not_set()}>
					<DetailRow label={m.label_type()} value={getAwakeningType()} />
					<DetailRow label={m.label_level()} value={getAwakeningLevel()} />
				</DetailsSection>

				<DetailsSection title={m.details_weapon_keys()} empty={!hasWeaponKeys} emptyMessage={m.collection_not_set()}>
					{#each weapon.weaponKeys ?? [] as key, i}
						<DetailRow label="Key {i + 1}" value={getWeaponKeyName(i)} />
					{/each}
				</DetailsSection>

				<DetailsSection title={m.details_ax_skills()} empty={!hasAxSkills} emptyMessage={m.collection_not_set()}>
					{#each weapon.ax ?? [] as ax, i}
						{#if ax.modifier?.id}
							<DetailRow label="Skill {i + 1}" value={`${ax.modifier.nameEn} +${ax.strength}${ax.modifier.suffix ?? ''}`} />
						{/if}
					{/each}
				</DetailsSection>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.collection-weapon-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary);
	}

	.tab-nav {
		padding: spacing.$unit-2x;
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.info-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-4x;
		padding: 0 spacing.$unit-2x;
	}

	.collection-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}
</style>
