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
	import type { CollectionWeapon } from '$lib/types/api/collection'
	import type { SimpleAxSkill } from '$lib/types/api/entities'
	import { useUpdateCollectionWeapon } from '$lib/api/mutations/collection.mutations'
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

	interface Props {
		weapon: CollectionWeapon
		isOwner: boolean
		onClose?: () => void
	}

	let { weapon: initialWeapon, isOwner, onClose }: Props = $props()

	// Local state for the weapon - updated when mutation succeeds
	let weapon = $state<CollectionWeapon>(initialWeapon)

	// Tab state
	let selectedTab = $state<'info' | 'collection'>('collection')

	// Edit mode state
	let isEditing = $state(false)

	// Sync local state when a different weapon is selected
	$effect(() => {
		weapon = initialWeapon
		isEditing = false
	})

	// Update mutation
	const updateMutation = useUpdateCollectionWeapon()

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
		axSkills: (weapon.ax as SimpleAxSkill[]) ?? []
	})

	// Element name for theming
	const ELEMENT_MAP: Record<number, 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementName = $derived(displayElement ? ELEMENT_MAP[displayElement] : undefined)

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
			if (updates.axModifier1 !== undefined) {
				input.axModifier1 = updates.axModifier1
				input.axStrength1 = updates.axStrength1
			}
			if (updates.axModifier2 !== undefined) {
				input.axModifier2 = updates.axModifier2
				input.axStrength2 = updates.axStrength2
			}

			const updatedWeapon = await updateMutation.mutateAsync({
				id: weapon.id,
				input
			})

			// Update local state with the response
			weapon = updatedWeapon

			isEditing = false
		} catch (error) {
			console.error('Failed to update collection weapon:', error)
		}
	}

	function handleCancel() {
		isEditing = false
	}

	function handleTabChange(value: string) {
		selectedTab = value as 'info' | 'collection'
		if (isEditing) {
			isEditing = false
		}
	}

	function getAwakeningType(): string {
		if (!weapon.awakening) return '—'
		const name =
			typeof weapon.awakening.type.name === 'string'
				? weapon.awakening.type.name
				: weapon.awakening.type.name?.en || 'Unknown'
		return name
	}

	function getAwakeningLevel(): string {
		if (!weapon.awakening) return '—'
		return String(weapon.awakening.level)
	}

	function getWeaponKeyName(index: number): string {
		const key = weapon.weaponKeys?.[index]
		if (!key) return '—'
		const name = key.name
		if (typeof name === 'string') return name
		return name?.en || name?.ja || '—'
	}

	// Check conditions
	const hasAwakening = $derived(weapon.awakening !== null)
	const hasWeaponKeys = $derived((weapon.weaponKeys?.length ?? 0) > 0)
	const hasAxSkills = $derived((weapon.ax?.length ?? 0) > 0 && weapon.ax?.some(ax => ax.modifier >= 0))
	const canChangeElement = $derived(weaponData?.element === 0)

	// Update sidebar header action
	$effect(() => {
		if (isOwner && selectedTab === 'collection' && !isEditing) {
			sidebar.setAction(() => (isEditing = true), 'Edit', elementName)
		} else {
			sidebar.clearAction()
		}
	})

	// Clean up sidebar action when component is destroyed
	$effect(() => {
		return () => {
			sidebar.clearAction()
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
			<Segment value="info">Info</Segment>
			<Segment value="collection">My Collection</Segment>
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
				{weaponData}
				{currentValues}
				onSave={handleSave}
				onCancel={handleCancel}
				saving={updateMutation.isPending}
			/>
		{:else}
			<div class="collection-view">
				<DetailsSection title="General">
					<DetailRow label="Uncap Level">
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
						<DetailRow label="Element">
							<ElementLabel element={displayElement} size="medium" />
						</DetailRow>
					{/if}
				</DetailsSection>

				<DetailsSection title="Awakening" empty={!hasAwakening} emptyMessage="Not set">
					<DetailRow label="Type" value={getAwakeningType()} />
					<DetailRow label="Level" value={getAwakeningLevel()} />
				</DetailsSection>

				<DetailsSection title="Weapon Keys" empty={!hasWeaponKeys} emptyMessage="Not set">
					{#each weapon.weaponKeys ?? [] as key, i}
						<DetailRow label="Key {i + 1}" value={getWeaponKeyName(i)} />
					{/each}
				</DetailsSection>

				<DetailsSection title="AX Skills" empty={!hasAxSkills} emptyMessage="Not set">
					{#each weapon.ax ?? [] as ax, i}
						{#if ax.modifier >= 0}
							<DetailRow label="Skill {i + 1}" value={`${ax.modifier}: ${ax.strength}`} />
						{/if}
					{/each}
				</DetailsSection>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.collection-weapon-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary, colors.$grey-10);
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
