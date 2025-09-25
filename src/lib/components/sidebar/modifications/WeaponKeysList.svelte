<script lang="ts">
  import { getWeaponKeyImages } from '$lib/utils/modifiers'
  import type { WeaponKey } from '$lib/types/api/entities'
  import type { LocalizedName } from '$lib/types/api/entities'

  interface Props {
    weaponKeys?: WeaponKey[]
    weaponData?: {
      element?: number
      proficiency?: number | number[]
      series?: number
      name?: LocalizedName
    }
    layout?: 'list' | 'grid'
  }

  let {
    weaponKeys,
    weaponData,
    layout = 'list'
  }: Props = $props()

  let keyImages = $derived(
    getWeaponKeyImages(
      weaponKeys,
      weaponData?.element,
      Array.isArray(weaponData?.proficiency) ? weaponData?.proficiency[0] : weaponData?.proficiency,
      weaponData?.series,
      weaponData?.name
    )
  )

  function getKeyDescription(key: WeaponKey): string {
    if (key.name?.en) return key.name.en
    if (key.name?.ja) return key.name.ja
    return key.slug || 'Weapon Key'
  }

  function getSlotLabel(slot: number, series?: number): string {
    if (series === 2) {
      return slot === 0 ? 'Alpha Pendulum' : 'Pendulum'
    }
    if (series === 3 || series === 34) {
      return `Teluma ${slot + 1}`
    }
    if (series === 17) {
      return slot === 0 ? 'Gauph Key' : `Ultima Key`
    }
    if (series === 22) {
      return `Emblem Slot ${slot + 1}`
    }
    return `Slot ${slot + 1}`
  }
</script>

{#if weaponKeys && weaponKeys.length > 0}
  <div class="weapon-keys-list {layout}">
    {#each weaponKeys as key, index}
      {@const imageData = keyImages[index]}
      <div class="weapon-key-item">
        {#if imageData}
          <img
            src={imageData.url}
            alt={imageData.alt}
            class="weapon-key-icon"
          />
        {/if}
        <div class="weapon-key-info">
          <span class="slot-label">
            {getSlotLabel(key.slot, weaponData?.series)}
          </span>
          <span class="key-name">
            {getKeyDescription(key)}
          </span>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .weapon-keys-list {
    display: flex;
    gap: spacing.$unit;

    &.list {
      flex-direction: column;
    }

    &.grid {
      flex-wrap: wrap;
      gap: spacing.$unit-2x;
    }

    .weapon-key-item {
      display: flex;
      gap: spacing.$unit-2x;
      align-items: center;
      padding: spacing.$unit;
      background: colors.$grey-85;
      border-radius: layout.$item-corner-small;
      transition: background 0.2s ease;

      &:hover {
        background: colors.$grey-80;
      }

      .weapon-key-icon {
        width: spacing.$unit-5x;
        height: spacing.$unit-5x;
        border-radius: layout.$item-corner-small;
        flex-shrink: 0;
      }

      .weapon-key-info {
        display: flex;
        flex-direction: column;
        gap: spacing.$unit-fourth;

        .slot-label {
          font-size: typography.$font-tiny;
          color: var(--text-tertiary, colors.$grey-60);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .key-name {
          font-size: typography.$font-small;
          color: var(--text-primary, colors.$grey-10);
          font-weight: typography.$medium;
        }
      }
    }
  }

  .grid {
    .weapon-key-item {
      flex-direction: column;
      text-align: center;
      padding: spacing.$unit-2x;

      .weapon-key-icon {
        width: spacing.$unit-6x;
        height: spacing.$unit-6x;
      }

      .weapon-key-info {
        align-items: center;
      }
    }
  }
</style>