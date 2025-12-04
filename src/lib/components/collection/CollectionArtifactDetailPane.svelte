<svelte:options runes={true} />

<script lang="ts">
	/**
	 * CollectionArtifactDetailPane - View-only pane for artifact details
	 *
	 * Shows artifact info in read-only mode. If user is owner,
	 * provides Edit button in header to push edit pane onto stack.
	 */
	import { onMount } from 'svelte'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { isQuirkArtifact } from '$lib/types/api/artifact'
	import { usePaneStack, type PaneConfig } from '$lib/stores/paneStack.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { getArtifactImage } from '$lib/utils/images'
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

	let { artifact, isOwner = false, onClose }: Props = $props()

	const paneStack = usePaneStack()

	// Image and name
	const imageUrl = $derived(getArtifactImage(artifact.artifact?.granblueId))
	const displayName = $derived.by(() => {
		const name = artifact.artifact?.name
		if (!name) return '—'
		if (typeof name === 'string') return name
		return name.en || name.ja || '—'
	})

	// Artifact properties
	const isQuirk = $derived(isQuirkArtifact(artifact.artifact))
	const proficiency = $derived(
		(isQuirk ? artifact.proficiency : artifact.artifact?.proficiency) ?? undefined
	)

	// Skills (only for standard artifacts)
	const skills = $derived(artifact.skills ?? [])
	const hasSkills = $derived(!isQuirk && skills.some((s) => s !== null))

	// Push edit pane
	function handleEdit() {
		const config: PaneConfig = {
			id: `artifact-edit-${artifact.id}`,
			title: 'Edit Artifact',
			component: CollectionArtifactEditPane,
			props: {
				artifact,
				onClose
			}
		}
		paneStack.push(config)
	}

	// Set up the Edit action button in the pane header for owners
	onMount(() => {
		if (isOwner) {
			sidebar.setAction(handleEdit, 'Edit')
		}

		return () => {
			// Clean up action when component unmounts
			sidebar.clearAction()
		}
	})
</script>

<div class="artifact-detail-pane">
	<!-- Header with image -->
	<div class="pane-header">
		<div class="artifact-image">
			<img src={imageUrl} alt={displayName} />
		</div>
		<h2 class="artifact-name">{displayName}</h2>
		{#if artifact.nickname}
			<p class="artifact-nickname">"{artifact.nickname}"</p>
		{/if}
	</div>

	<!-- Details content -->
	<div class="pane-content">
		<DetailsSection title="Properties">
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
				<div class="skills-list">
					{#each skills as skill, index}
						{#if skill}
							<ArtifactSkillDisplay slot={index + 1} {skill} />
						{/if}
					{/each}
				</div>
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
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.artifact-detail-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.pane-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-secondary);
	}

	.artifact-image {
		width: 80px;
		height: 80px;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
		margin-bottom: $unit;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.artifact-name {
		margin: 0;
		font-size: $font-large;
		font-weight: $bold;
		color: var(--text-primary);
		text-align: center;
	}

	.artifact-nickname {
		margin: $unit-half 0 0;
		font-size: $font-small;
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
	}

	.pane-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding-bottom: $unit-2x;
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit;
	}

	.grade-section {
		padding: $unit;
	}
</style>
