<script lang="ts">
  export let open = false
  export let title: string = 'Search'
  export let onClose: () => void = () => {}
  export let inline = false // when true, renders as an inline flex item instead of fixed drawer
</script>

<aside class="panel" class:open={open} class:inline={inline} aria-hidden={!open} aria-label={title}>
  <header class="panel-header">
    <h2>{title}</h2>
    <button class="close" on:click={onClose} aria-label="Close">×</button>
  </header>

  <div class="panel-body">
    <div class="search">
      <input type="text" placeholder="Search..." aria-label="Search" />
    </div>
    <slot />
  </div>
</aside>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/typography' as typography;
  .panel {
    width: var(--panel-w, 380px);
    max-width: 92vw;
    background: var(--app-bg, #fff);
    display: flex;
    flex-direction: column;
  }
  /* Fixed mode (default) */
  .panel:not(.inline) {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    box-shadow: var(--shadow-xl);
    transform: translateX(100%);
    transition: transform 200ms ease;
    z-index: effects.$z-popover;
  }
  .panel:not(.inline).open { transform: translateX(0); }
  /* Inline mode (used in grid pages so content doesn't shrink) */
  .panel.inline {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100dvh;
    box-shadow: var(--shadow-lg);
  }
  .panel.inline:not(.open) { display: none; }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #eee;
  }
  .panel-body { padding: 12px; overflow: auto; }
  .close { background: transparent; border: none; font-size: 22px; cursor: pointer; }
  .search input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: layout.$input-corner;
    font-size: typography.$font-body;
  }
</style>
