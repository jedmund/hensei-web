<svelte:options runes={true} />

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
	import type { Artifact, ArtifactSkill, ArtifactSkillInstance, CollectionArtifactInput } from '$lib/types/api/artifact'
	import { isQuirkArtifact, getSkillGroupForSlot } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { useCreateCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack, type PaneConfig } from '$lib/stores/paneStack.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ArtifactSkillRow from '$lib/components/artifact/ArtifactSkillRow.svelte'
	import ArtifactModifierList from '$lib/components/artifact/ArtifactModifierList.svelte'
	import Button from '$lib/components/ui/Button.svelte'

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

	// Element colors for dots (CSS colors that work in both light/dark themes)
	const ELEMENT_COLORS: Record<number, string> = {
		1: '#1dc688', // Wind - green
		2: '#ec5c5c', // Fire - red
		3: '#5cb7ec', // Water - blue
		4: '#ec985c', // Earth - orange/brown
		5: '#c65cec', // Dark - purple
		6: '#c59c0c'  // Light - gold/yellow
	}

	// Proficiency options - matches database enum values
	const proficiencyOptions = [
		{ value: 1, label: 'Sabre' },
		{ value: 2, label: 'Dagger' },
		{ value: 3, label: 'Axe' },
		{ value: 4, label: 'Spear' },
		{ value: 5, label: 'Bow' },
		{ value: 6, label: 'Staff' },
		{ value: 7, label: 'Melee' },
		{ value: 8, label: 'Harp' },
		{ value: 9, label: 'Gun' },
		{ value: 10, label: 'Katana' }
	]

	// Element options with colored dots
	const elementOptions = [
		{ value: 1, label: 'Wind', color: ELEMENT_COLORS[1] },
		{ value: 2, label: 'Fire', color: ELEMENT_COLORS[2] },
		{ value: 3, label: 'Water', color: ELEMENT_COLORS[3] },
		{ value: 4, label: 'Earth', color: ELEMENT_COLORS[4] },
		{ value: 5, label: 'Dark', color: ELEMENT_COLORS[5] },
		{ value: 6, label: 'Light', color: ELEMENT_COLORS[6] }
	]

	// Filter artifacts by selected proficiency
	// Standard artifacts have a fixed proficiency, quirk artifacts match any proficiency
	const filteredArtifacts = $derived.by(() => {
		if (!artifactsQuery.data || proficiency === undefined) return []
		return artifactsQuery.data.filter(a => {
			// Quirk artifacts have null proficiency - they work with any proficiency
			if (a.proficiency === null) return true
			// Standard artifacts match their fixed proficiency
			return a.proficiency === proficiency
		})
	})

	// Build artifact options for dropdown (filtered by proficiency)
	const artifactOptions = $derived.by(() => {
		return filteredArtifacts.map(a => ({
			value: a.id,
			label: typeof a.name === 'string' ? a.name : (a.name.en || a.name.ja || '—')
		}))
	})

	// Selected artifact data
	const selectedArtifact = $derived(
		artifactsQuery.data?.find(a => a.id === selectedArtifactId)
	)
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
		const artifact = artifactsQuery.data?.find(a => a.id === newArtifactId)
		if (artifact && isQuirkArtifact(artifact)) {
			level = 1
		}
	}

	// Validate form
	const isValid = $derived(
		proficiency !== undefined &&
		element !== undefined &&
		selectedArtifactId !== undefined
	)

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
</script>

<div class="add-artifact-sidebar">
	<div class="form-sections">
		<DetailsSection title="Base Properties">
			<DetailRow label="Proficiency" noHover>
				<Select
					options={proficiencyOptions}
					value={proficiency}
					onValueChange={handleProficiencyChange}
					size="small"
					contained
					placeholder="Select proficiency"
				/>
			</DetailRow>

			<DetailRow label="Element" noHover>
				<Select
					options={elementOptions}
					value={element}
					onValueChange={(v) => (element = v)}
					size="small"
					contained
					placeholder="Select element"
				/>
			</DetailRow>
		</DetailsSection>

		{#if proficiency !== undefined}
			<DetailsSection title="Artifact">
				<div class="artifact-select">
					{#if artifactsQuery.isPending}
						<p class="loading">Loading artifacts...</p>
					{:else if artifactsQuery.isError}
						<p class="error">Failed to load artifacts</p>
					{:else if artifactOptions.length === 0}
						<p class="empty">No artifacts available for this proficiency</p>
					{:else}
						<Select
							options={artifactOptions}
							value={selectedArtifactId}
							onValueChange={handleArtifactChange}
							placeholder="Select artifact..."
							size="medium"
							fullWidth
							contained
						/>
					{/if}
				</div>
			</DetailsSection>
		{/if}

		{#if selectedArtifact}
			<DetailsSection title="Configuration">
				<DetailRow label="Level" noHover>
					<Select
						options={levelOptions}
						value={level}
						onValueChange={(v) => v !== undefined && (level = v)}
						size="small"
						contained
					/>
				</DetailRow>

				<DetailRow label="Nickname" noHover>
					<Input
						bind:value={nickname}
						placeholder="Optional nickname"
						maxLength={50}
					/>
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
							/>
						{/each}
					</div>
				</DetailsSection>
			{/if}
		{/if}
	</div>

	<div class="form-footer">
		<Button variant="secondary" onclick={onClose}>Cancel</Button>
		<Button
			variant="primary"
			onclick={handleSave}
			disabled={!isValid || createMutation.isPending}
		>
			{createMutation.isPending ? 'Adding...' : 'Add to Collection'}
		</Button>
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
		color: colors.$grey-50;
	}

	.error {
		color: colors.$error;
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: 0 spacing.$unit;
	}

	.form-footer {
		display: flex;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		border-top: 1px solid var(--border-secondary);
		flex-shrink: 0;

		:global(button) {
			flex: 1;
		}
	}
</style>
