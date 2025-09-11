<script lang="ts">
  import Party from '$lib/components/party/Party.svelte'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<Party 
  initial={data.party} 
  canEditServer={data.canEditServer}
  authUserId={data.authUserId}
/>

