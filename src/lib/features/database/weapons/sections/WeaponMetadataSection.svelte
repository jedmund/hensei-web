<svelte:options runes={true} />

<script lang="ts">
  import type { WeaponSuggestions } from '$lib/api/adapters/entity.adapter'
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'
  import { getCharacterImage } from '$lib/utils/images'

  interface Props {
    weapon: any
    editMode?: boolean
    editData?: any
    // Suggestion support for batch import
    suggestions?: WeaponSuggestions
    dismissedSuggestions?: Set<string>
    onAcceptSuggestion?: (field: string, value: any) => void
    onDismissSuggestion?: (field: string) => void
  }

  let {
    weapon,
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
    <DetailItem
      label="Granblue ID"
      bind:value={editData.granblue_id}
      editable={true}
      type="text"
    />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(weapon.rarity)} />
    <DetailItem label="Granblue ID">
      {#if weapon.granblueId}
        <CopyableText value={weapon.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
    {#if weapon.recruits}
      <DetailItem label="Recruits">
        <a href="/database/characters/{weapon.recruits.id}" class="recruits-link">
          <img
            src={getCharacterImage(weapon.recruits.granblueId, 'square', '01')}
            alt={weapon.recruits.name.en || 'Recruited character'}
            class="recruits-image"
          />
          <span class="recruits-name">{weapon.recruits.name.en}</span>
        </a>
      </DetailItem>
    {/if}
  {/if}
</DetailsContainer>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .recruits-link {
    display: flex;
    align-items: center;
    gap: spacing.$unit;
    text-decoration: none;
    color: colors.$grey-30;

    &:hover .recruits-image {
      transform: scale(1.05);
    }

    &:hover .recruits-name {
      color: colors.$blue;
    }
  }

  .recruits-image {
    width: 32px;
    height: 32px;
    border-radius: layout.$item-corner-small;
    transition: transform 0.2s ease;
  }

  .recruits-name {
    font-size: typography.$font-regular;
    transition: color 0.2s ease;
  }
</style>

