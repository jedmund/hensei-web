<script lang="ts">
	// The generated list screen: the page title and the generated list. The
	// table belongs to one resource, so it starts over when the route moves to
	// another
	import { page } from '$app/state'
	import ListPageMeta from './ListPageMeta.svelte'
	import { isResourceName } from './names'
	import { resourceDef } from './registry'
	import ResourceTable from './ResourceTable.svelte'

	// The route only matches registered resources
	const name = $derived(page.params.resource ?? '')
	const def = $derived(resourceDef(name)!)
</script>

<ListPageMeta list={def.list} />

{#if isResourceName(name)}
	{#key name}
		<div class="database-page">
			<ResourceTable resource={name} />
		</div>
	{/key}
{/if}

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>
