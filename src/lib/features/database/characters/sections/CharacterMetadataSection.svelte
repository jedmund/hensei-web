<svelte:options runes={true} />

<script lang="ts">
  import type { CharacterSuggestions } from '$lib/api/adapters/entity.adapter'
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'
  import { getWeaponImage } from '$lib/utils/images'

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

  function formatPromotions(promotionNames: string[] | undefined): string {
    if (!promotionNames || promotionNames.length === 0) return '—'
    return promotionNames.join(', ')
  }
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
    <DetailItem
      label="Granblue ID"
      bind:value={editData.granblueId}
      editable={true}
      type="text"
    />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
    <DetailItem label="Granblue ID">
      {#if character.granblueId}
        <CopyableText value={character.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
    {#if character.recruitedBy}
      <DetailItem label="Recruited By">
        <a href="/database/weapons/{character.recruitedBy.id}" class="recruited-by-link">
          <img
            src={getWeaponImage(character.recruitedBy.granblueId, 'square')}
            alt={character.recruitedBy.name.en || 'Recruiting weapon'}
            class="recruited-by-image"
          />
          <span class="recruited-by-name">{character.recruitedBy.name.en}</span>
        </a>
      </DetailItem>
      <DetailItem
        label="Promotions"
        sublabel="Gacha pools from recruiting weapon"
        value={formatPromotions(character.recruitedBy.promotionNames)}
      />
    {/if}
  {/if}
</DetailsContainer>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .recruited-by-link {
    display: flex;
    align-items: center;
    gap: spacing.$unit;
    text-decoration: none;
    color: colors.$grey-30;

    &:hover .recruited-by-image {
      transform: scale(1.05);
    }

    &:hover .recruited-by-name {
      color: colors.$blue;
    }
  }

  .recruited-by-image {
    width: 32px;
    height: 32px;
    border-radius: layout.$item-corner-small;
    transition: transform 0.2s ease;
  }

  .recruited-by-name {
    font-size: typography.$font-regular;
    transition: color 0.2s ease;
  }
</style>

