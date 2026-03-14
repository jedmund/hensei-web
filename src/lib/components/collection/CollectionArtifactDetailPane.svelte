
<script lang="ts">
	/**
	 * CollectionArtifactDetailPane - View-only pane for artifact details
	 *
	 * Shows artifact info in read-only mode. If user is owner,
	 * provides Edit button in header to push edit pane onto stack.
	 */
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import type { CollectionArtifact, ArtifactSkillInstance } from '$lib/types/api/artifact'
	import { isQuirkArtifact, getSkillGroupForSlot } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { useDeleteCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
	import { usePaneStack, type PaneConfig, type ElementType } from '$lib/stores/paneStack.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { getArtifactImage, getBasePath } from '$lib/utils/images'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ArtifactGradeDisplay from '$lib/components/artifact/ArtifactGradeDisplay.svelte'
	import ArtifactSkillDisplay from '$lib/components/artifact/ArtifactSkillDisplay.svelte'
	import CollectionArtifactEditPane from './CollectionArtifactEditPane.svelte'
	import EquippableCharactersSection from './EquippableCharactersSection.svelte'

	interface Props {
		artifact: CollectionArtifact
		userId: string
		isOwner?: boolean
		onClose?: () => void
	}

	let { artifact: initialArtifact, userId, isOwner = false, onClose }: Props = $props()

	// Local state that can be updated when returning from edit pane
	let artifact = $state(initialArtifact)

	// Update artifact when edit pane returns with new data
	function handleArtifactUpdated(updatedArtifact: CollectionArtifact) {
		artifact = updatedArtifact
	}

	const paneStack = usePaneStack()
	const deleteMutation = useDeleteCollectionArtifact()

	// Wide image for header
	const wideImageUrl = $derived(getArtifactImage(artifact.artifact?.granblueId, 'wide'))
	const reliefBackgroundUrl = `${getBasePath()}/relief.png`

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

	// Get skill name by modifier and slot (different slots use different skill groups)
	function getSkillName(skill: ArtifactSkillInstance, slot: number): string {
		const group = getSkillGroupForSlot(slot)
		const skillDef = skillsQuery.data?.find(
			(s) => s.modifier === skill.modifier && s.skillGroup === group
		)
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
			sidebar.setAction(handleEdit, m.action_edit(), elementType)
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
	<div class="artifact-header" style:background="url({reliefBackgroundUrl}), linear-gradient(to right, #000, #484440, #000)">
		<img src={wideImageUrl} alt="" class="artifact-image" />
	</div>

	<div class="pane-content">
		<DetailsSection title="General">
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
				{#each skills as skill, index}
					{@const skillSlot = index + 1}
					{#if skill}
						<DetailRow label={getSkillName(skill, skillSlot)}>
							<ArtifactSkillDisplay {skill} {skillSlot} element={elementType} />
						</DetailRow>
					{/if}
				{/each}
			</DetailsSection>
		{/if}

		{#if proficiency}
			<EquippableCharactersSection
				{userId}
				element={artifact.element}
				{proficiency}
			/>
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
	@use '$src/themes/layout' as *;

	.artifact-detail-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		height: 100%;
	}

	.artifact-header {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		margin: 0 $unit-2x;
		border-radius: $card-corner;
		background-size: 420px 731px;
		background-position: -20px -20px;
		overflow: hidden;

		.artifact-image {
			width: 100%;
			max-width: 120px;
		}
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
		padding-bottom: $unit-2x;
	}

	.grade-section {
		padding: $unit;
	}
</style>
