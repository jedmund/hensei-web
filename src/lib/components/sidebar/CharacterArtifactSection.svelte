
<script lang="ts">
	/**
	 * CharacterArtifactSection - Artifact management section for character edit
	 *
	 * Shows current artifact (if equipped) with option to change/remove,
	 * or prompts to equip an artifact if none is equipped.
	 *
	 * Uses pane stack for artifact selection flow.
	 */
	import type { GridArtifact, CollectionArtifact } from '$lib/types/api/artifact'
	import type { Character } from '$lib/types/api/entities'
	import ArtifactSummary from './modifications/ArtifactSummary.svelte'
	import DisclosureRow from '$lib/components/ui/DisclosureRow.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** Currently equipped artifact (if any) */
		artifact?: GridArtifact | CollectionArtifact | null
		/** The character this artifact is being equipped to (for filtering) */
		character?: Character
		/** Callback to open artifact selection pane */
		onSelectArtifact?: () => void
		/** Callback to remove currently equipped artifact */
		onRemoveArtifact?: () => void
		/** Whether artifact can be changed */
		editable?: boolean
		/** Whether a save operation is in progress */
		saving?: boolean
	}

	let {
		artifact,
		character,
		onSelectArtifact,
		onRemoveArtifact,
		editable = true,
		saving = false
	}: Props = $props()

	const hasArtifact = $derived(!!artifact)
</script>

<div class="artifact-section">
	{#if hasArtifact && artifact}
		<ArtifactSummary {artifact} />

		{#if editable}
			<div class="artifact-actions">
				<Button variant="secondary" size="small" onclick={onSelectArtifact} disabled={saving}>
					{m.action_change()}
				</Button>
				<Button variant="ghost" size="small" onclick={onRemoveArtifact} disabled={saving}>
					{m.action_remove()}
				</Button>
			</div>
		{/if}
	{:else if editable}
		<DisclosureRow label={m.artifact_equip()} onclick={onSelectArtifact} disabled={saving} />
	{:else}
		<p class="no-artifact">{m.artifact_none_equipped()}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.artifact-section {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.artifact-actions {
		display: flex;
		gap: $unit;
		margin-top: $unit;
	}

	.no-artifact {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
