<svelte:options runes={true} />

<script lang="ts">
	/**
	 * CollectionArtifactDetailPane - View-only pane for artifact details
	 *
	 * Shows artifact info in read-only mode. If user is owner,
	 * provides Edit button in header to push edit pane onto stack.
	 */
	import { onMount } from 'svelte'
	import type { CollectionArtifact, ArtifactSkillInstance } from '$lib/types/api/artifact'
	import { isQuirkArtifact } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { useDeleteCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack, type PaneConfig, type ElementType } from '$lib/stores/paneStack.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ArtifactGradeDisplay from '$lib/components/artifact/ArtifactGradeDisplay.svelte'
	import ArtifactSkillDisplay from '$lib/components/artifact/ArtifactSkillDisplay.svelte'
	import CollectionArtifactEditPane from './CollectionArtifactEditPane.svelte'

	interface Props {
		artifact: CollectionArtifact
		isOwner?: boolean
		onClose?: () => void
	}

	let { artifact: initialArtifact, isOwner = false, onClose }: Props = $props()

	// Local state that can be updated when returning from edit pane
	let artifact = $state(initialArtifact)

	// Update artifact when edit pane returns with new data
	function handleArtifactUpdated(updatedArtifact: CollectionArtifact) {
		artifact = updatedArtifact
	}

	const paneStack = usePaneStack()
	const deleteMutation = useDeleteCollectionArtifact()


	// Artifact properties
	const isQuirk = $derived(isQuirkArtifact(artifact.artifact))
	const proficiency = $derived(
		(isQuirk ? artifact.proficiency : artifact.artifact?.proficiency) ?? undefined
	)

	// Skills (only for standard artifacts)
	const skills = $derived(artifact.skills ?? [])
	const hasSkills = $derived(!isQuirk && skills.some((s) => s !== null))

	// Query skill definitions to get names
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Get skill name by modifier
	function getSkillName(skill: ArtifactSkillInstance): string {
		const skillDef = skillsQuery.data?.find((s) => s.modifier === skill.modifier)
		return skillDef?.name?.en ?? 'Unknown Skill'
	}

	// Convert numeric element to ElementType string
	const elementNames: Record<number, ElementType> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const elementType = $derived(elementNames[artifact.element] ?? undefined)

	// Push edit pane
	function handleEdit() {
		const config: PaneConfig = {
			id: `artifact-edit-${artifact.id}`,
			title: 'Edit Artifact',
			component: CollectionArtifactEditPane,
			props: {
				artifact,
				onSaved: handleArtifactUpdated
			}
		}
		paneStack.push(config)
	}

	// Handle delete
	function handleDelete() {
		if (confirm('Are you sure you want to remove this artifact from your collection?')) {
			deleteMutation.mutate(artifact.id, {
				onSuccess: () => {
					onClose?.()
				}
			})
		}
	}

	// Set up the Edit action button and overflow menu for owners
	onMount(() => {
		if (isOwner) {
			sidebar.setAction(handleEdit, 'Edit', elementType)
			sidebar.setOverflowMenu([
				{
					label: 'Remove from collection',
					handler: handleDelete,
					variant: 'danger'
				}
			])
		}

		return () => {
			sidebar.clearAction()
			sidebar.clearOverflowMenu()
		}
	})
</script>

<div class="artifact-detail-pane">
	<div class="pane-content">
		<DetailsSection title="Properties">
			{#if artifact.nickname}
				<DetailRow label="Nickname" value={artifact.nickname} />
			{/if}

			<DetailRow label="Element">
				<ElementLabel element={artifact.element} size="medium" />
			</DetailRow>

			<DetailRow label="Proficiency">
				<ProficiencyLabel {proficiency} size="medium" />
			</DetailRow>

			<DetailRow label="Level" value="Lv.{artifact.level}" />

			{#if isQuirk}
				<DetailRow label="Type" value="Quirk" />
			{/if}
		</DetailsSection>

		{#if hasSkills}
			<DetailsSection title="Skills">
				{#each skills as skill}
					{#if skill}
						<DetailRow label={getSkillName(skill)}>
							<ArtifactSkillDisplay {skill} element={elementType} />
						</DetailRow>
					{/if}
				{/each}
			</DetailsSection>
		{/if}

		<DetailsSection title="Grade">
			<div class="grade-section">
				<ArtifactGradeDisplay grade={artifact.grade} />
			</div>
		</DetailsSection>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.artifact-detail-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding-bottom: $unit-2x;
	}

	.grade-section {
		padding: $unit;
	}
</style>
