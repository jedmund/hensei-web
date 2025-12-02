<svelte:options runes={true} />

<script lang="ts">
  import type { SummonSuggestions } from '$lib/api/adapters/entity.adapter'
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  interface Props {
    summon: any
    editMode?: boolean
    editData?: any
    // Suggestion support for batch import
    suggestions?: SummonSuggestions
    dismissedSuggestions?: Set<string>
    onAcceptSuggestion?: (field: string, value: any) => void
    onDismissSuggestion?: (field: string) => void
  }

  let {
    summon,
    editMode = false,
    editData = $bindable<any>(),
    suggestions,
    dismissedSuggestions,
    onAcceptSuggestion,
    onDismissSuggestion
  }: Props = $props()

  const rarityOptions = getRarityOptions()
</script>

<DetailsContainer title="Metadata">
  {#if editMode}
    <SuggestionDetailItem
      label="Rarity"
      bind:value={editData.rarity}
      editable={true}
      type="select"
      options={rarityOptions}
      suggestion={suggestions?.rarity}
      dismissedSuggestion={dismissedSuggestions?.has('rarity')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('rarity', suggestions?.rarity)}
      onDismissSuggestion={() => onDismissSuggestion?.('rarity')}
    />
    <SuggestionDetailItem
      label="Granblue ID"
      bind:value={editData.granblue_id}
      editable={true}
      type="text"
      suggestion={suggestions?.granblueId}
      dismissedSuggestion={dismissedSuggestions?.has('granblueId')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('granblueId', suggestions?.granblueId)}
      onDismissSuggestion={() => onDismissSuggestion?.('granblueId')}
    />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(summon.rarity)} />
    <DetailItem label="Granblue ID">
      {#if summon.granblueId}
        <CopyableText value={summon.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
  {/if}
</DetailsContainer>

