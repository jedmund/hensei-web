<script lang="ts">
	// The generated new page. The form belongs to one resource, so it starts
	// over when the route moves to another
	import { page } from '$app/state'
	import { resourceDef } from './registry'
	import ResourceNewForm from './ResourceNewForm.svelte'

	// The route only matches registered resources, and only creatable ones get here
	const def = $derived(resourceDef(page.params.resource ?? '')!)
</script>

{#key def.name}
	<ResourceNewForm {def} />
{/key}
