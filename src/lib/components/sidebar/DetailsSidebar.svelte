<script lang="ts">
  import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
  import { getElementLabel } from '$lib/utils/element'
  import { getRarityLabel } from '$lib/utils/rarity'
  import { getProficiencyLabel } from '$lib/utils/proficiency'
  import { getRaceLabel } from '$lib/utils/race'
  import { getGenderLabel } from '$lib/utils/gender'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

  interface Props {
    type: 'character' | 'weapon' | 'summon'
    item: GridCharacter | GridWeapon | GridSummon
  }

  let { type, item }: Props = $props()

  // Helper to get the actual item data
  function getItemData() {
    if (type === 'character') {
      return (item as GridCharacter).character
    } else if (type === 'weapon') {
      return (item as GridWeapon).weapon
    } else {
      return (item as GridSummon).summon
    }
  }

  // Helper for localized names
  function displayName(input: any): string {
    if (!input) return '—'
    const maybe = input.name ?? input
    if (typeof maybe === 'string') return maybe
    if (maybe && typeof maybe === 'object') {
      return maybe.en || maybe.ja || '—'
    }
    return '—'
  }

  // Get the item's actual data
  const itemData = $derived(getItemData())

  // Grid item info (uncap levels from the grid item itself)
  const gridUncapLevel = $derived(
    type === 'character' ? (item as GridCharacter).uncapLevel :
    type === 'weapon' ? (item as GridWeapon).uncapLevel :
    (item as GridSummon).uncapLevel
  )

  const gridTranscendence = $derived(
    type === 'character' ? (item as GridCharacter).transcendenceStep :
    type === 'weapon' ? (item as GridWeapon).transcendenceStep :
    (item as GridSummon).transcendenceStep
  )

  // Get image URL based on type
  function getImageUrl(): string {
    if (!itemData?.granblueId) {
      return type === 'character' ? '/images/placeholders/placeholder-character-main.png' :
             type === 'weapon' ? '/images/placeholders/placeholder-weapon-main.png' :
             '/images/placeholders/placeholder-summon-main.png'
    }

    const id = itemData.granblueId

    if (type === 'character') {
      let pose = '01'
      if (gridTranscendence && gridTranscendence > 0) pose = '04'
      else if (gridUncapLevel && gridUncapLevel >= 5) pose = '03'
      else if (gridUncapLevel && gridUncapLevel > 2) pose = '02'
      return `/images/character-main/${id}_${pose}.jpg`
    } else if (type === 'weapon') {
      return `/images/weapon-main/${id}.jpg`
    } else {
      return `/images/summon-main/${id}.jpg`
    }
  }
</script>

<div class="details-sidebar">
  <div class="item-header">
    <img
      src={getImageUrl()}
      alt={displayName(itemData)}
      class="item-image"
    />
    <div class="item-title">
      <h2>{displayName(itemData)}</h2>
      {#if itemData?.granblueId}
        <span class="granblue-id">ID: {itemData.granblueId}</span>
      {/if}
    </div>
  </div>

  <div class="details-section">
    <h3>Basic Information</h3>
    <div class="detail-row">
      <span class="label">Rarity</span>
      <span class="value">{getRarityLabel(itemData?.rarity)}</span>
    </div>
    <div class="detail-row">
      <span class="label">Element</span>
      <span class="value">{getElementLabel(itemData?.element)}</span>
    </div>

    {#if type === 'character'}
      {#if itemData?.race && itemData.race.length > 0}
        <div class="detail-row">
          <span class="label">Race</span>
          <span class="value">
            {itemData.race.map(r => getRaceLabel(r)).filter(Boolean).join(', ') || '—'}
          </span>
        </div>
      {/if}
      <div class="detail-row">
        <span class="label">Gender</span>
        <span class="value">{getGenderLabel(itemData?.gender)}</span>
      </div>
      {#if itemData?.proficiency && itemData.proficiency.length > 0}
        <div class="detail-row">
          <span class="label">Proficiencies</span>
          <span class="value">
            {itemData.proficiency.map(p => getProficiencyLabel(p)).filter(Boolean).join(', ') || '—'}
          </span>
        </div>
      {/if}
    {:else if type === 'weapon'}
      <div class="detail-row">
        <span class="label">Proficiency</span>
        <span class="value">{getProficiencyLabel(itemData?.proficiency?.[0])}</span>
      </div>
    {/if}
  </div>

  <div class="details-section">
    <h3>Uncap Status</h3>
    <div class="uncap-display">
      <UncapIndicator
        type={type}
        uncapLevel={gridUncapLevel}
        transcendenceStage={gridTranscendence}
        special={itemData?.special}
        flb={itemData?.uncap?.flb}
        ulb={itemData?.uncap?.ulb}
        transcendence={itemData?.uncap?.transcendence}
        editable={false}
      />
    </div>
    <div class="detail-row">
      <span class="label">Current Uncap</span>
      <span class="value">{gridUncapLevel ?? 0}★</span>
    </div>
    {#if gridTranscendence && gridTranscendence > 0}
      <div class="detail-row">
        <span class="label">Transcendence</span>
        <span class="value">Stage {gridTranscendence}</span>
      </div>
    {/if}
    {#if itemData?.uncap}
      <div class="detail-row">
        <span class="label">Available Uncaps</span>
        <span class="value">
          {[
            itemData.uncap.flb && 'FLB',
            itemData.uncap.ulb && 'ULB',
            itemData.uncap.transcendence && 'Transcendence'
          ].filter(Boolean).join(', ') || 'Standard'}
        </span>
      </div>
    {/if}
  </div>

  <div class="details-section">
    <h3>Stats</h3>
    {#if itemData?.hp}
      <div class="stats-group">
        <h4>HP</h4>
        <div class="detail-row">
          <span class="label">Base</span>
          <span class="value">{itemData.hp.minHp ?? '—'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Max</span>
          <span class="value">{itemData.hp.maxHp ?? '—'}</span>
        </div>
        {#if itemData.uncap?.flb && itemData.hp.maxHpFlb}
          <div class="detail-row">
            <span class="label">Max (FLB)</span>
            <span class="value">{itemData.hp.maxHpFlb}</span>
          </div>
        {/if}
        {#if itemData.uncap?.ulb && itemData.hp.maxHpUlb}
          <div class="detail-row">
            <span class="label">Max (ULB)</span>
            <span class="value">{itemData.hp.maxHpUlb}</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if itemData?.atk}
      <div class="stats-group">
        <h4>Attack</h4>
        <div class="detail-row">
          <span class="label">Base</span>
          <span class="value">{itemData.atk.minAtk ?? '—'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Max</span>
          <span class="value">{itemData.atk.maxAtk ?? '—'}</span>
        </div>
        {#if itemData.uncap?.flb && itemData.atk.maxAtkFlb}
          <div class="detail-row">
            <span class="label">Max (FLB)</span>
            <span class="value">{itemData.atk.maxAtkFlb}</span>
          </div>
        {/if}
        {#if itemData.uncap?.ulb && itemData.atk.maxAtkUlb}
          <div class="detail-row">
            <span class="label">Max (ULB)</span>
            <span class="value">{itemData.atk.maxAtkUlb}</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if type === 'weapon' && itemData?.weaponSkills && itemData.weaponSkills.length > 0}
    <div class="details-section">
      <h3>Skills</h3>
      <div class="skills-list">
        {#each itemData.weaponSkills as skill}
          <div class="skill-item">
            <h4>{displayName(skill) || 'Unknown Skill'}</h4>
            {#if skill.description}
              <p>{skill.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if type === 'summon' && itemData?.summonAuras && itemData.summonAuras.length > 0}
    <div class="details-section">
      <h3>Auras</h3>
      <div class="auras-list">
        {#each itemData.summonAuras as aura}
          <div class="aura-item">
            <h4>{displayName(aura) || 'Unknown Aura'}</h4>
            {#if aura.description}
              <p>{aura.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if type === 'weapon' && itemData?.weaponKeys && itemData.weaponKeys.length > 0}
    <div class="details-section">
      <h3>Weapon Keys</h3>
      <div class="keys-list">
        {#each itemData.weaponKeys as key}
          <div class="key-item">
            <span class="key-slot">Slot {key.slot}</span>
            <span class="key-name">{displayName(key.weaponKey1) || '—'}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if type === 'character' && itemData?.special}
    <div class="details-section">
      <div class="detail-row special-indicator">
        <span class="label">Special Character</span>
        <span class="value">✓</span>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .details-sidebar {
    padding: spacing.$unit-2x;
    color: var(--text-primary, colors.$grey-10);
  }

  .item-header {
    display: flex;
    gap: spacing.$unit-2x;
    align-items: flex-start;
    margin-bottom: spacing.$unit-3x;
    padding-bottom: spacing.$unit-2x;
    border-bottom: 1px solid var(--border-color, colors.$grey-70);
  }

  .item-image {
    width: 80px;
    height: 80px;
    border-radius: layout.$item-corner;
    object-fit: cover;
    background: colors.$grey-80;
    border: 1px solid colors.$grey-70;
  }

  .item-title {
    flex: 1;

    h2 {
      margin: 0 0 calc(spacing.$unit * 0.5) 0;
      font-size: typography.$font-xlarge;
      font-weight: typography.$medium;
      color: var(--text-primary, colors.$grey-10);
    }

    .granblue-id {
      font-size: typography.$font-small;
      color: var(--text-secondary, colors.$grey-50);
    }
  }

  .details-section {
    margin-bottom: spacing.$unit-3x;

    h3 {
      margin: 0 0 calc(spacing.$unit * 1.5) 0;
      font-size: typography.$font-regular;
      font-weight: typography.$medium;
      color: var(--text-secondary, colors.$grey-40);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h4 {
      margin: spacing.$unit 0 calc(spacing.$unit * 0.5) 0;
      font-size: typography.$font-regular;
      font-weight: typography.$medium;
      color: var(--text-primary, colors.$grey-20);
    }
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(spacing.$unit * 0.75) 0;
    border-bottom: 1px solid rgba(colors.$grey-70, 0.5);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: typography.$font-regular;
      color: var(--text-secondary, colors.$grey-50);
    }

    .value {
      font-size: typography.$font-regular;
      color: var(--text-primary, colors.$grey-10);
      font-weight: typography.$medium;
      text-align: right;
    }
  }

  .uncap-display {
    margin-bottom: calc(spacing.$unit * 1.5);
    padding: spacing.$unit;
    background: colors.$grey-90;
    border-radius: calc(layout.$item-corner * 0.5);
    display: flex;
    justify-content: center;
  }

  .stats-group {
    margin-bottom: spacing.$unit-2x;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .skills-list,
  .auras-list {
    .skill-item,
    .aura-item {
      padding: spacing.$unit;
      background: colors.$grey-90;
      border-radius: calc(layout.$item-corner * 0.5);
      margin-bottom: spacing.$unit;

      h4 {
        margin: 0 0 calc(spacing.$unit * 0.5) 0;
        font-size: typography.$font-regular;
        color: var(--text-primary, colors.$grey-10);
      }

      p {
        margin: 0;
        font-size: typography.$font-small;
        color: var(--text-secondary, colors.$grey-50);
        line-height: 1.4;
      }
    }
  }

  .keys-list {
    .key-item {
      display: flex;
      justify-content: space-between;
      padding: calc(spacing.$unit * 0.75);
      background: colors.$grey-90;
      border-radius: calc(layout.$item-corner * 0.5);
      margin-bottom: calc(spacing.$unit * 0.5);

      .key-slot {
        font-size: typography.$font-small;
        color: var(--text-secondary, colors.$grey-50);
      }

      .key-name {
        font-size: typography.$font-small;
        color: var(--text-primary, colors.$grey-10);
        font-weight: typography.$medium;
      }
    }
  }

  .special-indicator {
    .value {
      color: var(--color-success, #4caf50);
      font-size: typography.$font-large;
    }
  }
</style>