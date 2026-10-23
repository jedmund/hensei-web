<script lang="ts">
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { normalizeCharacterUncap } from '$lib/utils/uncap'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity data from API
		itemData: any
		gridUncapLevel: number | null
		gridTranscendence: number | null
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { type, itemData, gridUncapLevel, gridTranscendence }: Props = $props()

	const special = $derived(type === 'character' && !!itemData?.special)
	const flb = $derived(!!itemData?.uncap?.flb)
	const normalizedCharacterUncap = $derived(
		type === 'character'
			? normalizeCharacterUncap({ special, uncap: itemData?.uncap ?? { flb: false } })
			: null
	)
	const hasTranscendence = $derived(
		normalizedCharacterUncap?.transcendence ?? !!itemData?.uncap?.transcendence
	)
	const hasUlb = $derived(normalizedCharacterUncap?.ulb ?? !!itemData?.uncap?.ulb)
	const ulbProp = $derived(hasUlb)
	const transcendenceProp = $derived(special ? false : hasTranscendence)
	const maxTranscendenceStage = $derived(
		type === 'character' ? (normalizedCharacterUncap?.maxTranscendenceStage ?? 0) : 5
	)

	// MLB level differs between special (3*) and regular characters (4*).
	const mlbLevel = $derived(type === 'character' && !special ? 4 : 3)
	const flbLevel = $derived(mlbLevel + 1)
	const ulbLevel = $derived(flbLevel + 1)

	const transcendenceLevel = 6

	// Stat value for the transcendence row. Characters store it on the stat
	// block; weapons/summons store it at the top level.
	const hpTranscendenceValue = $derived(
		type === 'character' ? itemData?.hp?.maxHpTranscendence : itemData?.transcendenceHp
	)
	const atkTranscendenceValue = $derived(
		type === 'character' ? itemData?.atk?.maxAtkTranscendence : itemData?.transcendenceAtk
	)
	const hpUlbValue = $derived(
		type === 'character' && normalizedCharacterUncap?.legacySpecialUlb
			? itemData?.hp?.maxHpTranscendence
			: itemData?.hp?.maxHpUlb
	)
	const atkUlbValue = $derived(
		type === 'character' && normalizedCharacterUncap?.legacySpecialUlb
			? itemData?.atk?.maxAtkTranscendence
			: itemData?.atk?.maxAtkUlb
	)

	const showFlbRow = $derived(flb && (type === 'character' ? !!itemData?.hp?.maxHpFlb : true))
	const showUlbRow = $derived(hasUlb)
	// Show the transcendence row whenever the item can be transcended — the
	// Info view advertises max-tier stats, not the grid's current uncap.
	const showTranscendenceRow = $derived(transcendenceProp)
</script>

{#snippet indicator(label: string, uncapLevel: number, transcendenceStage = 0)}
	<Tooltip content={label}>
		<UncapIndicator
			{type}
			{uncapLevel}
			{transcendenceStage}
			{flb}
			ulb={ulbProp}
			transcendence={transcendenceProp}
			{maxTranscendenceStage}
			{special}
		/>
	</Tooltip>
{/snippet}

{#if itemData?.hp}
	<DetailsSection title={m.details_hp()}>
		<DetailRow value={itemData.hp.minHp}>
			{#snippet labelSlot()}{@render indicator(m.details_base(), 0)}{/snippet}
		</DetailRow>
		<DetailRow value={itemData.hp.maxHp}>
			{#snippet labelSlot()}{@render indicator(m.details_mlb(), mlbLevel)}{/snippet}
		</DetailRow>
		{#if showFlbRow && itemData.hp.maxHpFlb}
			<DetailRow value={itemData.hp.maxHpFlb}>
				{#snippet labelSlot()}{@render indicator(m.details_flb(), flbLevel)}{/snippet}
			</DetailRow>
		{/if}
		{#if showUlbRow && hpUlbValue}
			<DetailRow value={hpUlbValue}>
				{#snippet labelSlot()}{@render indicator(m.details_ulb(), ulbLevel)}{/snippet}
			</DetailRow>
		{/if}
		{#if showTranscendenceRow && hpTranscendenceValue}
			<DetailRow value={hpTranscendenceValue}>
				{#snippet labelSlot()}
					{@render indicator(
						m.details_transcendence_level({ level: String(maxTranscendenceStage) }),
						transcendenceLevel,
						maxTranscendenceStage
					)}
				{/snippet}
			</DetailRow>
		{/if}
	</DetailsSection>
{/if}

{#if itemData?.atk}
	<DetailsSection title={m.details_atk()}>
		<DetailRow value={itemData.atk.minAtk}>
			{#snippet labelSlot()}{@render indicator(m.details_base(), 0)}{/snippet}
		</DetailRow>
		<DetailRow value={itemData.atk.maxAtk}>
			{#snippet labelSlot()}{@render indicator(m.details_mlb(), mlbLevel)}{/snippet}
		</DetailRow>
		{#if showFlbRow && itemData.atk.maxAtkFlb}
			<DetailRow value={itemData.atk.maxAtkFlb}>
				{#snippet labelSlot()}{@render indicator(m.details_flb(), flbLevel)}{/snippet}
			</DetailRow>
		{/if}
		{#if showUlbRow && atkUlbValue}
			<DetailRow value={atkUlbValue}>
				{#snippet labelSlot()}{@render indicator(m.details_ulb(), ulbLevel)}{/snippet}
			</DetailRow>
		{/if}
		{#if showTranscendenceRow && atkTranscendenceValue}
			<DetailRow value={atkTranscendenceValue}>
				{#snippet labelSlot()}
					{@render indicator(
						m.details_transcendence_level({ level: String(maxTranscendenceStage) }),
						transcendenceLevel,
						maxTranscendenceStage
					)}
				{/snippet}
			</DetailRow>
		{/if}
	</DetailsSection>
{/if}
