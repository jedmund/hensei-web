<script lang="ts">
	/**
	 * A record's edit form, generated from its definition: the sections of
	 * `layout.edit` (else `layout.detail`), an input per shown field, and Save
	 * through `save.update`. Leaving with unsaved changes asks first.
	 */
	import { untrack } from 'svelte'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'
	import { UnsavedChangesGuard } from '$lib/features/database/detail/unsavedChanges.svelte'
	import UnsavedChangesDialog from '$lib/features/database/detail/UnsavedChangesDialog.svelte'
	import DeleteRecord from './DeleteRecord.svelte'
	import { recordHref, recordTitle } from './detail'
	import { formSections } from './form'
	import { formElement } from './inputs/options'
	import { createRecordForm } from './recordForm.svelte'
	import ResourceFormSections from './ResourceFormSections.svelte'
	import type { AnyResourceDef } from './registry'

	interface Props {
		def: AnyResourceDef
		/** The route id */
		id: string
		record: unknown
	}

	let { def, id, record }: Props = $props()

	// The screen keys this component by record, so the first values are the only ones
	const form = untrack(() => createRecordForm(def, record))
	const sections = untrack(() => formSections(def, 'edit'))
	// After load and derive, so opening the form doesn't count as a change
	const unsaved = new UnsavedChangesGuard(() => form.values)
	unsaved.reset()

	const recordDef = $derived(def.record!)
	const detailUrl = $derived(`/database/${def.name}/${id}`)
	const noun = $derived(recordDef.noun())
	const title = $derived(recordTitle(def, record) || noun)
	// Checkboxes and buttons follow the element being picked
	const element = $derived(formElement(form.values))

	async function save() {
		const saved = await form.save()
		if (!saved) {
			toast.error(form.formError ?? m.db_edit_invalid())
			return
		}
		unsaved.release()
		goto(recordHref(def, saved))
	}

	function deleted() {
		unsaved.release()
		goto(`/database/${def.name}`)
	}
</script>

<PageMeta title={m.page_title_db_edit({ name: title })} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.db_edit_title({ noun })}>
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={detailUrl}>
				{m.db_detail_back()}
			</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="element-ghost" {element} size="small" onclick={save} disabled={form.saving}>
				{form.saving ? m.action_saving() : m.action_save()}
			</Button>
		{/snippet}
	</DatabasePageHeader>

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
</div>

<UnsavedChangesDialog guard={unsaved} />

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}
</style>
