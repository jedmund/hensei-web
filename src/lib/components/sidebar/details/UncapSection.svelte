<script lang="ts">
	/**
	 * UncapSection - Uncap stars and transcendence stage of a grid item
	 */
	import type { ComponentProps } from 'svelte'
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import SyncMenuButton from './SyncMenuButton.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import TranscendenceStar from '$lib/components/uncap/TranscendenceStar.svelte'
	import { getGridItemUncapCaps } from '$lib/utils/uncap'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		gridUncapLevel: number | null
		gridTranscendence: number | null
		/** Section sync button props; omit when the section is in sync */
		sync?: ComponentProps<typeof SyncMenuButton> | undefined
	}

	let { type, item, gridUncapLevel, gridTranscendence, sync }: Props = $props()

	const uncapCaps = $derived(getGridItemUncapCaps(type, item))
</script>

<DetailsSection title={m.details_uncap_transcendence()}>
	{#snippet action()}
		{#if sync}
			<SyncMenuButton {...sync} />
		{/if}
	{/snippet}
	<DetailRow label={m.details_max_uncap_level()}>
		<UncapIndicator
			{type}
			uncapLevel={gridUncapLevel}
			transcendenceStage={gridTranscendence}
			flb={uncapCaps.flb}
			ulb={uncapCaps.ulb}
			transcendence={uncapCaps.transcendence}
			maxTranscendenceStage={uncapCaps.maxTranscendenceStage}
			hideTranscendence
		/>
	</DetailRow>
	{#if uncapCaps.transcendence}
		<DetailRow label={m.details_transcended_to()}>
			<span class="transcendence-row">
				<TranscendenceStar
					stage={gridTranscendence ?? 0}
					{type}
					maxStage={uncapCaps.maxTranscendenceStage}
				/>
				<span class="transcendence-level"
					>{m.details_transcendence_level({ level: String(gridTranscendence ?? 0) })}</span
				>
			</span>
		</DetailRow>
	{/if}
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.transcendence-row {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.transcendence-level {
		font-size: typography.$font-regular;
		color: var(--text-primary);
		font-weight: typography.$medium;
	}
</style>
