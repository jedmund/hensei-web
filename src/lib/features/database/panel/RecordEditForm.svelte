<script lang="ts">
	// Loads the open record and shows its edit form in the panel. The form
	// starts over for each record (j/k keeps the panel in edit mode)
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import type { AnyResourceDef } from '$lib/features/database/schema/registry'
	import RecordEditBody from './RecordEditBody.svelte'

	interface Props {
		def: AnyResourceDef
		/** The route id */
		id: string
		onSaved: () => void
		onSavingChange?: (saving: boolean) => void
	}

	let { def, id, onSaved, onSavingChange }: Props = $props()

	const recordDef = $derived(def.record!)
	const query = createQuery(() => recordDef.query(id))

	let body = $state<RecordEditBody | undefined>(undefined)

	/** Save the open form; false while it's loading or when the save fails */
	export function save(): Promise<boolean> {
		return body?.save() ?? Promise.resolve(false)
	}
</script>

{#if query.data}
	{#key id}
		<RecordEditBody bind:this={body} {def} record={query.data} {onSaved} {onSavingChange} />
	{/key}
{:else if query.isPending}
	<div class="loading" aria-busy="true"></div>
{:else}
	<NotFoundPlaceholder
		title={m.db_detail_not_found_title({ noun: recordDef.noun() })}
		message={m.db_detail_not_found_message()}
		backHref="/database/{def.name}"
		backLabel={m.db_detail_back_to({ list: def.list.label() })}
	/>
{/if}

<style lang="scss">
	.loading {
		min-height: 320px;
	}
</style>
