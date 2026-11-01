<script lang="ts">
	// The generated list page: the resource's list, titled by its label
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import type { ResourceName } from './names'
	import { RESOURCES } from './registry'
	import ResourceTable from './ResourceTable.svelte'

	// The route only matches registered resources
	const resource = $derived(page.params.resource as ResourceName)
</script>

<PageMeta
	title={m.page_title_db_entity({ name: RESOURCES[resource].list.label() })}
	description={m.page_desc_home()}
/>

<div class="database-page">
	{#key resource}
		<ResourceTable {resource} />
	{/key}
</div>

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>
