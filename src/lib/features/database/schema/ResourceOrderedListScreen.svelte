<script lang="ts">
	// The generated list screen for an ordered resource (`list.ordered`): the
	// page title and every row in its stored order. Starts over when the route
	// moves to another resource, like the table's screen
	import { page } from '$app/state'
	import ListPageMeta from './ListPageMeta.svelte'
	import { isResourceName } from './names'
	import OrderedList from './OrderedList.svelte'
	import { resourceDef } from './registry'

	// The route only matches registered resources
	const name = $derived(page.params.resource ?? '')
	const def = $derived(resourceDef(name)!)
</script>

<ListPageMeta list={def.list} />

{#if isResourceName(name)}
	{#key name}
		<OrderedList resource={name} />
	{/key}
{/if}
