
<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import Select from '$lib/components/ui/Select.svelte'
  import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'
  import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'
  import { CHARACTER_SEASON_NAMES, getSeasonName } from '$lib/types/enums'
  import { localizedName } from '$lib/utils/locale'
  import { createQuery, queryOptions } from '@tanstack/svelte-query'
  import { entityAdapter } from '$lib/api/adapters/entity.adapter'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
  }

  let {
    character,
    editMode = false,
    editData = $bindable()
  }: Props = $props()

  const rarityOptions = getRarityOptions()

  // Season options (nullable, so include a "None" option)
  const seasonOptions = [
    { value: 0, label: 'None' },
    ...Object.entries(CHARACTER_SEASON_NAMES).map(([value, label]) => ({
      value: Number(value),
      label
    }))
  ]

  // Fetch series from API
  const characterSeriesQuery = createQuery(() =>
    queryOptions({
      queryKey: ['characterSeries', 'list'] as const,
      queryFn: () => entityAdapter.getCharacterSeriesList(),
      enabled: editMode,
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24
    })
  )

  // Series options for multiselect (UUID-based)
  const seriesOptions = $derived(
    (characterSeriesQuery.data ?? [])
      .toSorted((a, b) => a.order - b.order)
      .map((s) => ({
        value: s.id,
        label: localizedName(s.name)
      }))
  )

  function formatPromotions(promotionNames: string[] | undefined): string {
    if (!promotionNames || promotionNames.length === 0) return '—'
    return promotionNames.join(', ')
  }

  // Format series for display - use API-provided series objects or seriesNames
  function formatSeriesDisplay(): string {
    // Use pre-computed seriesNames from API if available
    if (character.seriesNames && character.seriesNames.length > 0) {
      return character.seriesNames.join(', ')
    }
    // CharacterSeriesRef[] objects
    if (Array.isArray(character.series) && character.series.length > 0) {
      const first = character.series[0]
      if (typeof first === 'object' && first !== null && 'name' in first) {
        return (character.series as Array<{ name: { en?: string; ja?: string } }>)
          .map((s) => localizedName(s.name))
          .join(', ')
      }
    }
    return '—'
  }
</script>

<DetailsContainer title="Metadata">
  {#if editMode}
    <DetailItem
      label="Name (EN)"
      bind:value={editData.name}
      editable={true}
      type="text"
      placeholder="English name"
    />
    <DetailItem
      label="Name (JP)"
      bind:value={editData.nameJp}
      editable={true}
      type="text"
      placeholder="日本語名"
    />
    <DetailItem
      label="Rarity"
      bind:value={editData.rarity}
      editable={true}
      type="select"
      options={rarityOptions}
    />
    <DetailItem
      label="Granblue ID"
      bind:value={editData.granblueId}
      editable={true}
      type="text"
      placeholder="Granblue ID"
    />
    <DetailItem
      label="Character ID"
      sublabel="Separate multiple IDs with commas"
      bind:value={editData.characterId}
      editable={true}
      type="text"
      placeholder="Character IDs"
    />
    {#if character.recruitedBy}
      <DetailItem label="Recruited By">
        <AssociatedEntityLink type="weapon" entity={character.recruitedBy} />
      </DetailItem>
      <DetailItem
        label="Promotions"
        sublabel="Gacha pools from recruiting weapon"
        value={formatPromotions(character.recruitedBy.promotionNames)}
      />
    {/if}
    <DetailItem label="Series" editable={true}>
      <MultiSelect
        size="medium"
        options={seriesOptions}
        bind:value={editData.series}
        placeholder="Select series"
        contained
      />
    </DetailItem>
    <DetailItem
      label="Season"
      sublabel="Used to disambiguate characters with the same name"
      editable={true}
    >
      <Select
        size="medium"
        options={seasonOptions}
        bind:value={editData.season}
        contained
      />
    </DetailItem>
  {:else}
    <DetailItem label="Name (EN)" value={character.name?.en || '—'} />
    <DetailItem label="Name (JP)" value={character.name?.ja || '—'} />
    <DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
    <DetailItem label="Granblue ID">
      {#if character.granblueId}
        <CopyableText value={character.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
    {#if character.characterId?.length}
      <DetailItem label="Character ID">
        <CopyableText value={character.characterId.join(', ')} />
      </DetailItem>
    {/if}
    {#if character.recruitedBy}
      <DetailItem label="Recruited By">
        <AssociatedEntityLink type="weapon" entity={character.recruitedBy} />
      </DetailItem>
      <DetailItem
        label="Promotions"
        sublabel="Gacha pools from recruiting weapon"
        value={formatPromotions(character.recruitedBy.promotionNames)}
      />
    {/if}
    <DetailItem label="Series" value={formatSeriesDisplay()} />
    <DetailItem label="Season" value={getSeasonName(character.season) || '—'} />
  {/if}
</DetailsContainer>


