<svelte:options runes={true} />

<script lang="ts">
  import type { CharacterSuggestions } from '$lib/api/adapters/entity.adapter'
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
    // Suggestion support for batch import
    suggestions?: CharacterSuggestions
    dismissedSuggestions?: Set<string>
    onAcceptSuggestion?: (field: string, value: any) => void
    onDismissSuggestion?: (field: string) => void
  }

  let {
    character,
    editMode = false,
    editData = $bindable(),
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
      bind:value={editData.granblueId}
      editable={true}
      type="text"
      suggestion={suggestions?.granblueId}
      dismissedSuggestion={dismissedSuggestions?.has('granblueId')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('granblueId', suggestions?.granblueId)}
      onDismissSuggestion={() => onDismissSuggestion?.('granblueId')}
    />
    <DetailItem label="Character ID" bind:value={editData.characterId} editable={true} type="number" />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
    <DetailItem label="Granblue ID">
      {#if character.granblueId}
        <CopyableText value={character.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
  {/if}
</DetailsContainer>

