<script lang="ts">
	/**
	 * A record's edit form inside the record panel (GBF-173): the same
	 * generated form as the full edit page (`layout.edit` sections, inputs,
	 * validation and Save through `save.update`). Navigating away with unsaved
	 * changes, stepping with j/k included, asks first.
	 */
	import { untrack } from 'svelte'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'
	import { UnsavedChangesGuard } from '$lib/features/database/detail/unsavedChanges.svelte'
	import UnsavedChangesDialog from '$lib/features/database/detail/UnsavedChangesDialog.svelte'
	import DeleteRecord from '$lib/features/database/schema/DeleteRecord.svelte'
	import { recordTitle } from '$lib/features/database/schema/detail'
	import { formSections } from '$lib/features/database/schema/form'
	import { formElement } from '$lib/features/database/schema/inputs/options'
	import { createRecordForm } from '$lib/features/database/schema/recordForm.svelte'
	import ResourceFormSections from '$lib/features/database/schema/ResourceFormSections.svelte'
	import type { AnyResourceDef } from '$lib/features/database/schema/registry'

	interface Props {
		def: AnyResourceDef
		record: unknown
		/** After a successful save: the panel goes back to the detail */
		onSaved: () => void
		/** Follows the form's saving state, for the panel header's Save */
		onSavingChange?: (saving: boolean) => void
	}

	let { def, record, onSaved, onSavingChange }: Props = $props()

	// The panel keys this component by record, so the first values are the only ones
	const form = untrack(() => createRecordForm(def, record))
	const sections = untrack(() => formSections(def, 'edit'))
	// After load and derive, so opening the form doesn't count as a change
	const unsaved = new UnsavedChangesGuard(() => form.values)
	unsaved.reset()

	const recordDef = $derived(def.record!)
	const title = $derived(recordTitle(def, record) || recordDef.noun())
	const element = $derived(formElement(form.values))

	$effect(() => {
		onSavingChange?.(form.saving)
	})

	/** Save the form; the panel header's Save and ⌘S call this */
	export async function save(): Promise<boolean> {
		const saved = await form.save()
		if (!saved) {
			toast.error(form.formError ?? m.db_edit_invalid())
			return false
		}
		// The saved values are the new baseline, so leaving asks nothing
		unsaved.reset()
		onSaved()
		return true
	}

	function deleted() {
		unsaved.release()
		goto(`/database/${def.name}`)
	}
</script>

<DetailScaffold
	type={recordDef.type}
	item={record}
	image={recordDef.image?.(record)}
	fallbackImage={recordDef.fallbackImage?.(record)}
	editMode
>
	<ResourceFormSections {form} {sections} {record} {element} />
	{#if def.save?.destroy}
		<DeleteRecord {def} {record} {title} onDeleted={deleted} />
	{/if}
</DetailScaffold>

<UnsavedChangesDialog guard={unsaved} />
