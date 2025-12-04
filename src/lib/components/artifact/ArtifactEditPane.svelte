<svelte:options runes={true} />

<script lang="ts">
	import type {
		ArtifactInstance,
		ArtifactSkillInstance,
		ArtifactSkill,
		ArtifactGrade
	} from '$lib/types/api/artifact'
	import { isQuirkArtifact, getSkillGroupForSlot } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { usePaneStack, type PaneConfig, type ElementType } from '$lib/stores/paneStack.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Slider from '$lib/components/ui/Slider.svelte'
	import ArtifactSkillRow from './ArtifactSkillRow.svelte'
	import ArtifactModifierList from './ArtifactModifierList.svelte'
	import ArtifactGradeDisplay from './ArtifactGradeDisplay.svelte'

	interface Props {
		/** The artifact instance being edited */
		artifact: ArtifactInstance
		/** Handler when artifact is updated */
		onUpdate?: (updates: Partial<ArtifactInstance>) => void
		/** Whether editing is disabled (view-only mode) */
		disabled?: boolean
	}

	const { artifact, onUpdate, disabled = false }: Props = $props()

	// Get the pane stack from context for pushing modifier selection panes
	const paneStack = usePaneStack()

	// Local state for edits
	let element = $state(artifact.element)
	let level = $state(artifact.level)
	let proficiency = $state(artifact.proficiency)
	let skills = $state<(ArtifactSkillInstance | null)[]>([...artifact.skills])

	// Derived values
	const artifactData = $derived(artifact.artifact)
	const isQuirk = $derived(isQuirkArtifact(artifactData))
	const canChangeElement = $derived(true) // Artifacts can always change element
	const canChangeProficiency = $derived(isQuirk) // Only quirk artifacts have variable proficiency

	// Query all skills for skill rows
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Get skills available for each slot
	function getSkillsForSlot(slot: number): ArtifactSkill[] {
		if (!skillsQuery.data) return []
		const group = getSkillGroupForSlot(slot)
		return skillsQuery.data.filter((s) => s.skillGroup === group)
	}

	// Element options with color dots
	const elementOptions = [
		{ value: 1, label: 'Wind', color: '#3ee489' },
		{ value: 2, label: 'Fire', color: '#fa6d6d' },
		{ value: 3, label: 'Water', color: '#6cc9ff' },
		{ value: 4, label: 'Earth', color: '#fd9f5b' },
		{ value: 5, label: 'Dark', color: '#de7bff' },
		{ value: 6, label: 'Light', color: '#e8d633' }
	]

	// Convert numeric element to ElementType string
	const elementTypeMap: Record<number, ElementType> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementType = $derived(elementTypeMap[element] ?? undefined)

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

	// Proficiency options (1-10 for quirk artifacts)
	const proficiencyOptions = [
		{ value: 1, label: 'Sabre' },
		{ value: 2, label: 'Dagger' },
		{ value: 3, label: 'Spear' },
		{ value: 4, label: 'Axe' },
		{ value: 5, label: 'Staff' },
		{ value: 6, label: 'Gun' },
		{ value: 7, label: 'Melee' },
		{ value: 8, label: 'Bow' },
		{ value: 9, label: 'Harp' },
		{ value: 10, label: 'Katana' }
	]

	// Get proficiency display name
	function getProficiencyName(profValue: number | null | undefined): string {
		if (!profValue) return '—'
		const option = proficiencyOptions.find((o) => o.value === profValue)
		return option?.label ?? '—'
	}

	// Push modifier selection pane for a specific slot
	function handleSelectModifier(slot: number) {
		const config: PaneConfig = {
			id: `modifier-select-${slot}`,
			title: `Select Skill ${slot}`,
			component: ArtifactModifierList,
			props: {
				slot,
				selectedModifier: skills[slot - 1]?.modifier,
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
		notifyUpdate()

		// Pop back to the edit pane
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
		notifyUpdate()
	}

	// Handle element change
	function handleElementChange(newElement: number | undefined) {
		if (newElement === undefined) return
		element = newElement
		notifyUpdate()
	}

	// Handle level change
	function handleLevelChange(newLevel: number | undefined) {
		if (newLevel === undefined) return
		level = newLevel
		notifyUpdate()
	}

	// Handle proficiency change
	function handleProficiencyChange(newProficiency: number | undefined) {
		if (newProficiency === undefined) return
		proficiency = newProficiency
		notifyUpdate()
	}

	// Notify parent of updates
	function notifyUpdate() {
		if (!onUpdate) return

		const updates: Partial<ArtifactInstance> = {
			element,
			level,
			skills: [...skills]
		}

		if (isQuirk && proficiency !== undefined) {
			updates.proficiency = proficiency
		}

		onUpdate(updates)
	}

	// Current grade (from artifact or could be recalculated)
	const currentGrade: ArtifactGrade = $derived(artifact.grade)
</script>

<div class="artifact-edit-pane">
	<DetailsSection title="Base Properties">
		{#if canChangeProficiency}
			<DetailRow label="Proficiency" noHover>
				{#if disabled}
					<span>{getProficiencyName(proficiency)}</span>
				{:else}
					<Select
						options={proficiencyOptions}
						value={proficiency}
						onValueChange={handleProficiencyChange}
						size="small"
						contained
						placeholder="Select proficiency"
						{disabled}
					/>
				{/if}
			</DetailRow>
		{:else}
			<DetailRow label="Proficiency" value={getProficiencyName(artifactData.proficiency)} />
		{/if}

		<DetailRow label="Element" noHover>
			{#if disabled}
				{@const elementOption = elementOptions.find((o) => o.value === element)}
				<span class="element-display">
					<span class="element-dot" style="background-color: {elementOption?.color}"></span>
					{elementOption?.label ?? '—'}
				</span>
			{:else}
				<Select
					class="element-select"
					options={elementOptions}
					value={element}
					onValueChange={handleElementChange}
					contained
					{disabled}
				/>
			{/if}
		</DetailRow>

		<DetailRow label="Level" noHover>
			{#if disabled || isQuirk}
				<span>{level}</span>
			{:else}
				<div class="level-slider">
					<Slider
						value={level}
						onValueChange={handleLevelChange}
						min={1}
						max={5}
						step={1}
						element={elementType}
						{disabled}
					/>
					<span class="level-value">{level}</span>
				</div>
			{/if}
		</DetailRow>
	</DetailsSection>

	{#if !isQuirk}
		<DetailsSection title="Skills">
			<div class="skills-list">
				{#each [1, 2, 3, 4] as slot}
					<ArtifactSkillRow
						{slot}
						skill={skills[slot - 1] ?? null}
						availableSkills={getSkillsForSlot(slot)}
						onSelectModifier={() => handleSelectModifier(slot)}
						onUpdateSkill={(update) => handleUpdateSkill(slot, update)}
						{disabled}
					/>
				{/each}
			</div>
		</DetailsSection>
	{/if}

	<DetailsSection title="Grade">
		<div class="grade-section">
			<ArtifactGradeDisplay grade={currentGrade} />
		</div>
	</DetailsSection>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.artifact-edit-pane {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		padding-bottom: spacing.$unit-4x;
	}

	:global(.artifact-edit-pane .select.medium) {
		min-width: 120px;
	}

	.element-display {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.element-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.level-slider {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		flex: 1;

		.level-value {
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			min-width: spacing.$unit-2x;
			text-align: center;
		}
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: 0 spacing.$unit;
	}

	.grade-section {
		padding: spacing.$unit;
	}
</style>
