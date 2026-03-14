
<script lang="ts">
	/**
	 * AddArtifactSidebar - Root pane for adding a new artifact to collection
	 *
	 * Flow:
	 * 1. Select proficiency (weapon type)
	 * 2. Select element (with colored dots)
	 * 3. Select artifact (filtered by proficiency - ~3 options)
	 * 4. Configure level, nickname
	 * 5. Configure skills (for standard artifacts only, uses pane stack)
	 */
	import * as m from '$lib/paraglide/messages'
	import { onMount, untrack } from 'svelte'
	import type {
		Artifact,
		ArtifactSkill,
		ArtifactSkillInstance,
		CollectionArtifactInput
	} from '$lib/types/api/artifact'
	import { isQuirkArtifact, getSkillGroupForSlot } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { useCreateCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack, type PaneConfig, type ElementType } from '$lib/stores/paneStack.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ArtifactSkillRow from '$lib/components/artifact/ArtifactSkillRow.svelte'
	import ArtifactModifierList from '$lib/components/artifact/ArtifactModifierList.svelte'
	import { getElementColor } from '$lib/utils/gw'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		/** Callback when artifact is created successfully */
		onSuccess?: () => void
		/** Callback to close the sidebar */
		onClose?: () => void
	}

	const { onSuccess, onClose }: Props = $props()

	// Get the pane stack from context for pushing modifier selection panes
	const paneStack = usePaneStack()

	// Mutation for creating artifact
	const createMutation = useCreateCollectionArtifact()

	// Query all artifacts for dropdown
	const artifactsQuery = createQuery(() => artifactQueries.all())

	// Query all skills for skill rows
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Local state for form - ordered by user flow
	let proficiency = $state<number | undefined>(undefined)
	let element = $state<number | undefined>(undefined)
	let selectedArtifactId = $state<string | undefined>(undefined)
	let level = $state<number>(1)
	let nickname = $state<string>('')
	let skills = $state<(ArtifactSkillInstance | null)[]>([null, null, null, null])

	// Proficiency options - matches database enum values
	const proficiencyOptions = [
		{ value: 1, label: m.proficiency_sabre() },
		{ value: 2, label: m.proficiency_dagger() },
		{ value: 3, label: m.proficiency_axe() },
		{ value: 4, label: m.proficiency_spear() },
		{ value: 5, label: m.proficiency_bow() },
		{ value: 6, label: m.proficiency_staff() },
		{ value: 7, label: m.proficiency_melee() },
		{ value: 8, label: m.proficiency_harp() },
		{ value: 9, label: m.proficiency_gun() },
		{ value: 10, label: m.proficiency_katana() }
	]

	// Element options with colored dots
	const elementOptions = [
		{ value: 1, label: m.element_wind(), color: getElementColor(1) },
		{ value: 2, label: m.element_fire(), color: getElementColor(2) },
		{ value: 3, label: m.element_water(), color: getElementColor(3) },
		{ value: 4, label: m.element_earth(), color: getElementColor(4) },
		{ value: 5, label: m.element_dark(), color: getElementColor(5) },
		{ value: 6, label: m.element_light(), color: getElementColor(6) }
	]

	// Filter artifacts by selected proficiency
	// Standard artifacts have a fixed proficiency, quirk artifacts match any proficiency
	const filteredArtifacts = $derived.by(() => {
		if (!artifactsQuery.data || proficiency === undefined) return []
		return artifactsQuery.data.filter((a) => {
			// Quirk artifacts have null proficiency - they work with any proficiency
			if (a.proficiency === null) return true
			// Standard artifacts match their fixed proficiency
			return a.proficiency === proficiency
		})
	})

	// Build artifact options for dropdown (filtered by proficiency)
	const artifactOptions = $derived.by(() => {
		return filteredArtifacts.map((a) => ({
			value: a.id,
			label: localizedName(a.name)
		}))
	})

	// Selected artifact data
	const selectedArtifact = $derived(artifactsQuery.data?.find((a) => a.id === selectedArtifactId))
	const isQuirk = $derived(selectedArtifact ? isQuirkArtifact(selectedArtifact) : false)

	// Level options (1-5 for standard, fixed at 1 for quirk)
	const levelOptions = $derived(
		isQuirk
			? [{ value: 1, label: '1' }]
			: [
					{ value: 1, label: '1' },
					{ value: 2, label: '2' },
					{ value: 3, label: '3' },
					{ value: 4, label: '4' },
					{ value: 5, label: '5' }
				]
	)

	// Get skills available for each slot
	function getSkillsForSlot(slot: number): ArtifactSkill[] {
		if (!skillsQuery.data) return []
		const group = getSkillGroupForSlot(slot)
		return skillsQuery.data.filter((s) => s.skillGroup === group)
	}

	// Push modifier selection pane for a specific slot
	function handleSelectModifier(slot: number) {
		const config: PaneConfig = {
			id: `modifier-select-${slot}`,
			title: m.artifact_select_skill({ slot: String(slot) }),
			component: ArtifactModifierList,
			props: {
				slot,
				selectedModifier: skills[slot - 1]?.modifier,
				element: elementType,
				onSelect: (skill: ArtifactSkill) => handleModifierSelected(slot, skill)
			}
		}
		paneStack.push(config)
	}

	// Handle when a modifier is selected from the list
	function handleModifierSelected(slot: number, skill: ArtifactSkill) {
		const index = slot - 1
		const newSkills = [...skills]

		// Create new skill instance with first available strength and level 1
		const firstStrength = skill.baseValues.find((v) => v !== null && v !== 0) ?? 0
		newSkills[index] = {
			modifier: skill.modifier,
			strength: firstStrength,
			level: 1
		}

		skills = newSkills

		// Pop back to the root pane
		paneStack.pop()
	}

	// Handle skill updates from skill row
	function handleUpdateSkill(slot: number, update: Partial<ArtifactSkillInstance>) {
		const index = slot - 1
		const currentSkill = skills[index]
		if (!currentSkill) return

		const newSkills = [...skills]
		newSkills[index] = { ...currentSkill, ...update }
		skills = newSkills
	}

	// Handle proficiency change - reset artifact selection
	function handleProficiencyChange(newProficiency: number | undefined) {
		proficiency = newProficiency
		// Reset artifact selection when proficiency changes
		selectedArtifactId = undefined
		skills = [null, null, null, null]
	}

	// Handle artifact selection change
	function handleArtifactChange(newArtifactId: string | undefined) {
		selectedArtifactId = newArtifactId
		// Reset skills when artifact changes
		skills = [null, null, null, null]
		// Reset level for quirk
		const artifact = artifactsQuery.data?.find((a) => a.id === newArtifactId)
		if (artifact && isQuirkArtifact(artifact)) {
			level = 1
		}
	}

	// Handle level change - redistributes skill levels to maintain constraint
	function handleLevelChange(newLevel: number | undefined) {
		if (newLevel === undefined) return

		const oldBudget = level + 3
		const newBudget = newLevel + 3
		const budgetDiff = newBudget - oldBudget

		level = newLevel

		// If budget changed and we have skills, redistribute levels
		if (budgetDiff !== 0 && !isQuirk) {
			redistributeSkillLevels(budgetDiff)
		}
	}

	// Redistribute skill levels when artifact level changes
	function redistributeSkillLevels(budgetDiff: number) {
		const newSkills = [...skills]
		let remaining = budgetDiff

		if (remaining > 0) {
			// Add points: distribute to skills that can accept more (max 5)
			for (let i = 0; i < 4 && remaining > 0; i++) {
				const skill = newSkills[i]
				if (skill) {
					const canAdd = Math.min(5 - skill.level, remaining)
					if (canAdd > 0) {
						newSkills[i] = { ...skill, level: skill.level + canAdd }
						remaining -= canAdd
					}
				}
			}
		} else {
			// Remove points: take from skills with highest levels first
			remaining = Math.abs(remaining)
			const indices = [0, 1, 2, 3]
				.filter((i) => newSkills[i] !== null)
				.sort((a, b) => (newSkills[b]?.level ?? 0) - (newSkills[a]?.level ?? 0))

			for (const i of indices) {
				if (remaining <= 0) break
				const skill = newSkills[i]
				if (skill && skill.level > 1) {
					const canRemove = Math.min(skill.level - 1, remaining)
					newSkills[i] = { ...skill, level: skill.level - canRemove }
					remaining -= canRemove
				}
			}
		}

		skills = newSkills
	}

	// Validate form
	const isValid = $derived(
		proficiency !== undefined && element !== undefined && selectedArtifactId !== undefined
	)

	// Convert numeric element to ElementType string for button styling
	const elementTypeMap: Record<number, ElementType> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementType = $derived(element !== undefined ? elementTypeMap[element] : undefined)

	// Handle save
	async function handleSave() {
		if (!selectedArtifactId || !isValid || element === undefined) return

		const input: CollectionArtifactInput = {
			artifactId: selectedArtifactId,
			element,
			level,
			nickname: nickname.trim() || undefined,
			// For quirk artifacts, send the user-selected proficiency
			proficiency: isQuirk ? proficiency : undefined,
			skill1: skills[0] ?? undefined,
			skill2: skills[1] ?? undefined,
			skill3: skills[2] ?? undefined,
			skill4: skills[3] ?? undefined
		}

		createMutation.mutate(input, {
			onSuccess: () => {
				onSuccess?.()
				onClose?.()
			}
		})
	}

	// Update the header action button based on form validity and element
	function updateHeaderAction() {
		if (isValid && !createMutation.isPending) {
			sidebar.setAction(handleSave, m.action_add(), elementType)
		} else {
			sidebar.clearAction()
		}
	}

	// Set up header action on mount and when validity/element changes
	onMount(() => {
		updateHeaderAction()
		return () => sidebar.clearAction()
	})

	// Reactively update action when form state changes
	$effect(() => {
		// Access reactive dependencies
		const _ = [isValid, element, createMutation.isPending]
		// Use untrack to avoid infinite loop when calling sidebar methods
		untrack(() => updateHeaderAction())
	})
</script>

<div class="add-artifact-sidebar">
	<div class="form-sections">
		<DetailsSection title={m.section_base_properties()}>
			<DetailRow label={m.label_proficiency()} noHover>
				<Select
					options={proficiencyOptions}
					value={proficiency}
					onValueChange={handleProficiencyChange}
					size="small"
					contained
					placeholder={m.placeholder_select_proficiency()}
				/>
			</DetailRow>

			<DetailRow label={m.label_element()} noHover>
				<Select
					options={elementOptions}
					value={element}
					onValueChange={(v) => (element = v)}
					size="small"
					contained
					placeholder={m.placeholder_select_element()}
				/>
			</DetailRow>
		</DetailsSection>

		{#if proficiency !== undefined}
			<DetailsSection title={m.artifact_title()}>
				<div class="artifact-select">
					{#if artifactsQuery.isPending}
						<p class="loading">{m.sidebar_loading_artifacts()}</p>
					{:else if artifactsQuery.isError}
						<p class="error">{m.sidebar_artifacts_error()}</p>
					{:else if artifactOptions.length === 0}
						<p class="empty">{m.sidebar_no_artifacts_proficiency()}</p>
					{:else}
						<Select
							options={artifactOptions}
							value={selectedArtifactId}
							onValueChange={handleArtifactChange}
							placeholder={m.placeholder_select_artifact()}
							size="medium"
							fullWidth
							contained
						/>
					{/if}
				</div>
			</DetailsSection>
		{/if}

		{#if selectedArtifact}
			<DetailsSection title={m.section_configuration()}>
				<DetailRow label={m.label_level()} noHover>
					{#if isQuirk}
						<span>1</span>
					{:else}
						<Select
							options={levelOptions}
							value={level}
							onValueChange={handleLevelChange}
							contained
						/>
					{/if}
				</DetailRow>

				<DetailRow label={m.label_nickname()} noHover>
					<Input bind:value={nickname} placeholder={m.placeholder_optional_nickname()} maxLength={50} />
				</DetailRow>
			</DetailsSection>

			{#if !isQuirk}
				<DetailsSection title={m.artifact_skills()}>
					<div class="skills-list">
						{#each [1, 2, 3, 4] as slot}
							<ArtifactSkillRow
								{slot}
								skill={skills[slot - 1] ?? null}
								allSkills={skills}
								artifactLevel={level}
								availableSkills={getSkillsForSlot(slot)}
								onSelectModifier={() => handleSelectModifier(slot)}
								onUpdateSkill={(update) => handleUpdateSkill(slot, update)}
							/>
						{/each}
					</div>
				</DetailsSection>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.add-artifact-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.form-sections {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		overflow-y: auto;
		padding-bottom: spacing.$unit-4x;
	}

	.artifact-select {
		padding: spacing.$unit;
	}

	.loading,
	.error,
	.empty {
		padding: spacing.$unit-2x;
		text-align: center;
		color: var(--text-secondary);
	}

	.error {
		color: var(--danger);
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}
</style>
