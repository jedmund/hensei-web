<script lang="ts">
	/**
	 * SummonEditPane - Edit component for collection summons
	 *
	 * Provides edit controls for summon customization:
	 * - Uncap level (editable UncapIndicator)
	 * - Transcendence step
	 *
	 * Summons are simpler than weapons/characters - they only track uncap and transcendence.
	 */
	import type { Summon } from '$lib/types/api/entities'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

	export interface SummonEditValues {
		uncapLevel: number
		transcendenceStep: number
	}

	export interface SummonEditUpdates {
		uncapLevel?: number
		transcendenceStep?: number
	}

	interface Props {
		/** The base summon data */
		summonData: Summon | undefined
		/** Current values for all edit fields */
		currentValues: SummonEditValues
		/** Callback when save is clicked */
		onSave?: (updates: SummonEditUpdates) => void
	}

	let { summonData, currentValues, onSave }: Props = $props()

	// Internal state
	let uncapLevel = $state(currentValues.uncapLevel)
	let transcendenceStep = $state(currentValues.transcendenceStep)

	// Re-initialize when currentValues changes
	$effect(() => {
		uncapLevel = currentValues.uncapLevel
		transcendenceStep = currentValues.transcendenceStep
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
	const elementName = $derived(summonData?.element ? ELEMENT_MAP[summonData.element] : undefined)

	function handleUncapUpdate(newLevel: number) {
		uncapLevel = newLevel
	}

	function handleTranscendenceUpdate(newStage: number) {
		transcendenceStep = newStage
	}

	// Export save function so parent can call it from header button
	export function save() {
		const updates: SummonEditUpdates = {
			uncapLevel,
			transcendenceStep
		}
		onSave?.(updates)
	}
</script>

<div class="summon-edit-pane">
	<div class="edit-sections">
		<DetailsSection title="Uncap Level">
			<div class="section-content uncap-section">
				<UncapIndicator
					type="summon"
					{uncapLevel}
					transcendenceStage={transcendenceStep}
					flb={summonData?.uncap?.flb}
					ulb={summonData?.uncap?.ulb}
					transcendence={summonData?.uncap?.transcendence}
					editable={true}
					updateUncap={handleUncapUpdate}
					updateTranscendence={handleTranscendenceUpdate}
				/>
			</div>
		</DetailsSection>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.summon-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.edit-sections {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
		overflow-y: auto;
	}

	.section-content {
		padding: spacing.$unit;
	}
</style>
