
<script lang="ts">
	import type {
		ArtifactInstance,
		ArtifactSkillInstance,
		ArtifactSkill
	} from '$lib/types/api/artifact'
	import { isQuirkArtifact, getSkillGroupForSlot } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { usePaneStack, type PaneConfig } from '$lib/stores/paneStack.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ArtifactSkillRow from './ArtifactSkillRow.svelte'
	import ArtifactModifierList from './ArtifactModifierList.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getElementColor, getElementKey, getElementOptions } from '$lib/utils/element'

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
	// Use type assertion since this pane is used with CollectionArtifact which has nickname
	let nickname = $state((artifact as { nickname?: string }).nickname ?? '')
	let element = $state(artifact.element)
	let level = $state(artifact.level)
	let proficiency = $state(artifact.proficiency)
	let skills = $state<(ArtifactSkillInstance | null)[]>(initializeSkillLevels([...artifact.skills]))

	// Initialize skill levels to meet the constraint (artifact.level + 3)
	// This handles cases where imported data has incorrect skill levels
	function initializeSkillLevels(
		inputSkills: (ArtifactSkillInstance | null)[]
	): (ArtifactSkillInstance | null)[] {
		// Skip for quirk artifacts
		if (artifact.artifact?.rarity === 'quirk') return inputSkills

		const targetSum = artifact.level + 3
		const currentSum = inputSkills.reduce((sum, s) => sum + (s?.level ?? 0), 0)
		const diff = targetSum - currentSum

		if (diff === 0) return inputSkills

		// Need to adjust skill levels
		const adjusted = [...inputSkills]

		if (diff > 0) {
			// Need to add points
			let remaining = diff
			for (let i = 0; i < 4 && remaining > 0; i++) {
				const skill = adjusted[i]
				if (skill) {
					const canAdd = Math.min(5 - skill.level, remaining)
					if (canAdd > 0) {
						adjusted[i] = { ...skill, level: skill.level + canAdd }
						remaining -= canAdd
					}
				}
			}
		} else {
			// Need to remove points
			let remaining = Math.abs(diff)
			const indices = [0, 1, 2, 3]
				.filter((i) => adjusted[i] !== null)
				.sort((a, b) => (adjusted[b]?.level ?? 0) - (adjusted[a]?.level ?? 0))

			for (const i of indices) {
				if (remaining <= 0) break
				const skill = adjusted[i]
				if (skill && skill.level > 1) {
					const canRemove = Math.min(skill.level - 1, remaining)
					adjusted[i] = { ...skill, level: skill.level - canRemove }
					remaining -= canRemove
				}
			}
		}

		return adjusted
	}

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
	const elementOptions = getElementOptions()
		.filter((opt) => opt.value !== 0)
		.map((opt) => ({ ...opt, color: getElementColor(opt.value) }))

	// Convert numeric element to ElementType string
	const elementType = $derived(getElementKey(element))

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
		{ value: 1, label: m.proficiency_sabre() },
		{ value: 2, label: m.proficiency_dagger() },
		{ value: 3, label: m.proficiency_spear() },
		{ value: 4, label: m.proficiency_axe() },
		{ value: 5, label: m.proficiency_staff() },
		{ value: 6, label: m.proficiency_gun() },
		{ value: 7, label: m.proficiency_melee() },
		{ value: 8, label: m.proficiency_bow() },
		{ value: 9, label: m.proficiency_harp() },
		{ value: 10, label: m.proficiency_katana() }
	]

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

		// Pop back to the edit pane BEFORE notifying, so the header update targets the right pane
		paneStack.pop()
		notifyUpdate()
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

	// Handle level change - redistributes skill levels to maintain constraint
	function handleLevelChange(newLevel: number | undefined) {
		if (newLevel === undefined) return

		const oldBudget = level + 3
		const newBudget = newLevel + 3
		const budgetDiff = newBudget - oldBudget

		level = newLevel

		// If budget increased, distribute extra points to skills
		// If budget decreased, remove points from skills (starting from highest)
		if (budgetDiff !== 0 && !isQuirk) {
			redistributeSkillLevels(budgetDiff)
		}

		notifyUpdate()
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
			// Sort indices by skill level descending
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

	// Handle proficiency change
	function handleProficiencyChange(newProficiency: number | undefined) {
		if (newProficiency === undefined) return
		proficiency = newProficiency
		notifyUpdate()
	}

	// Handle nickname change
	function handleNicknameChange(event: Event) {
		const target = event.target as HTMLInputElement
		nickname = target.value
		notifyUpdate()
	}

	// Notify parent of updates
	function notifyUpdate() {
		if (!onUpdate) return

		const updates: Partial<ArtifactInstance> = {
			nickname: nickname.trim() || undefined,
			element,
			level,
			skills: [...skills]
		}

		if (isQuirk && proficiency !== undefined) {
			updates.proficiency = proficiency
		}

		onUpdate(updates)
	}
</script>

<div class="artifact-edit-pane">
	<DetailsSection title={m.details_basic_info()}>
		<DetailRow label={m.label_nickname()} noHover>
			{#if disabled}
				<span>{nickname || '—'}</span>
			{:else}
				<Input
					class="nickname-input"
					value={nickname}
					oninput={handleNicknameChange}
					placeholder={m.placeholder_optional_nickname()}
					maxLength={50}
					contained
				/>
			{/if}
		</DetailRow>
		{#if canChangeProficiency}
			<DetailRow label={m.label_proficiency()} noHover>
				{#if disabled}
					<ProficiencyLabel {proficiency} size="medium" />
				{:else}
					<Select
						options={proficiencyOptions}
						value={proficiency}
						onValueChange={handleProficiencyChange}
						size="small"
						contained
						placeholder={m.placeholder_select_proficiency()}
						{disabled}
					/>
				{/if}
			</DetailRow>
		{:else}
			<DetailRow label={m.label_proficiency()} noHover>
				<ProficiencyLabel proficiency={artifactData.proficiency ?? undefined} size="medium" />
			</DetailRow>
		{/if}

		<DetailRow label={m.label_element()} noHover>
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

		<DetailRow label={m.label_level()} noHover>
			{#if disabled || isQuirk}
				<span>{level}</span>
			{:else}
				<Select
					options={levelOptions}
					value={level}
					onValueChange={handleLevelChange}
					contained
					{disabled}
				/>
			{/if}
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
						{disabled}
					/>
				{/each}
			</div>
		</DetailsSection>
	{/if}
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
		min-width: 180px;
	}

	:global(.nickname-input) {
		min-width: 180px;
	}

	:global(.nickname-input input) {
		padding: spacing.$unit spacing.$unit-4x spacing.$unit calc(spacing.$unit * 1.5) !important;
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

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}
</style>
