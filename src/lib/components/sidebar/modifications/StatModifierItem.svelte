<script lang="ts">
  interface Props {
    label: string
    value: string | number
    suffix?: string
    icon?: string
    variant?: 'default' | 'enhanced' | 'max'
    class?: string
  }

  let {
    label,
    value,
    suffix = '',
    icon,
    variant = 'default',
    class: className = ''
  }: Props = $props()
</script>

<div class="stat-modifier {variant} {className}">
  {#if icon}
    <img src={icon} alt="" class="stat-icon" />
  {/if}
  <span class="label">{label}</span>
  <span class="value">{value}{suffix}</span>
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;
  @use '$src/themes/effects' as effects;

  .stat-modifier {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: spacing.$unit;
    background: colors.$grey-90;
    border-radius: layout.$item-corner-small;
    transition: all 0.2s ease;

    .stat-icon {
      width: spacing.$unit-2x;
      height: spacing.$unit-2x;
      margin-right: spacing.$unit;
    }

    .label {
      font-size: typography.$font-small;
      color: var(--text-secondary, colors.$grey-50);
      flex: 1;
    }

    .value {
      font-size: typography.$font-regular;
      font-weight: typography.$medium;
      color: var(--text-primary, colors.$grey-10);
      text-align: right;
    }

    &.enhanced {
      background: colors.$grey-85;
      box-shadow: effects.$hover-shadow;

      .value {
        color: var(--color-success, #4caf50);
      }
    }

    &.max {
      background: linear-gradient(135deg, colors.$grey-85, colors.$grey-80);
      box-shadow: effects.$hover-shadow;

      .value {
        color: #ffd700;
        font-weight: typography.$bold;
      }
    }
  }
</style>