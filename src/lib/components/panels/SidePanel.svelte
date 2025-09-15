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

<style>
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
    box-shadow: -2px 0 18px rgba(0,0,0,0.25);
    transform: translateX(100%);
    transition: transform 200ms ease;
    z-index: 50;
  }
  .panel:not(.inline).open { transform: translateX(0); }
  /* Inline mode (used in grid pages so content doesn't shrink) */
  .panel.inline {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100dvh;
    box-shadow: -2px 0 18px rgba(0,0,0,0.1);
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
    border-radius: 8px;
    font-size: 14px;
  }
</style>
