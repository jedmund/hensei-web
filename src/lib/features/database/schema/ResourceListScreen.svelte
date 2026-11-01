<script lang="ts">
	// The generated list screen: the resource's list under its page title.
	// Takes no props, like every list screen: the resource is the route's.
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import type { ResourceName } from './names'
	import { RESOURCES } from './registry'
	import ResourceTable from './ResourceTable.svelte'

	// The route only matches registered resources
	const resource = $derived(page.params.resource as ResourceName)
	const def = $derived(RESOURCES[resource])
</script>

<PageMeta
	title={m.page_title_db_entity({ name: def.list.label() })}
	description={m.page_desc_home()}
/>

<div class="database-page">
	<!-- ResourceTable builds its table once, so a different resource is a new one -->
	{#key resource}
		<ResourceTable {resource} />
	{/key}
</div>

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>
