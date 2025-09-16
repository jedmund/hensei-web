<!-- Re-export the enhanced Button component from UI directory -->
<script lang="ts">
  import Button from './ui/button/Button.svelte';

  const props = $props();
</script>

<Button {...props} />