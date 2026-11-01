<script lang="ts">
	// The generated edit page. The form belongs to one record, so it starts
	// over when the route moves to another
	import { page } from '$app/state'
	import { resourceDef } from './registry'
	import ResourceEditForm from './ResourceEditForm.svelte'
	import type { RecordScreenData } from './types'

	let { data }: { data: RecordScreenData<unknown> } = $props()

	// The route only matches registered resources, and only editable ones get here
	const def = $derived(resourceDef(data.resource)!)
	const id = $derived(page.params.id ?? '')
</script>

{#key `${def.name}/${id}`}
	<ResourceEditForm {def} {id} record={data.record} />
{/key}
