<script lang="ts">
	import type { PageData } from './$types'
	import Party from '$lib/components/party/Party.svelte'

	let { data }: { data: PageData } = $props()
</script>

{#if data?.party}
	<Party party={data.party} canEdit={data.canEdit || false} authUserId={data.authUserId} />
{:else}
	<div>
		<h1>Party not found</h1>
		<p>No party data available for this code.</p>
	</div>
{/if}
