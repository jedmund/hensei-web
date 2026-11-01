<script lang="ts">
	/**
	 * A resource's create form, generated from its definition: the sections of
	 * `layout.create` (else the edit layout) without the fields kept off it,
	 * the `save.asyncValidate` checks, and Save through `save.create`, then on
	 * to the new record. Leaving after entering anything asks first.
	 */
	import { untrack } from 'svelte'
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import { UnsavedChangesGuard } from '$lib/features/database/detail/unsavedChanges.svelte'
	import UnsavedChangesDialog from '$lib/features/database/detail/UnsavedChangesDialog.svelte'
	import { recordHref } from './detail'
	import { formSections } from './form'
	import { formElement } from './inputs/options'
	import { createRecordForm } from './recordForm.svelte'
	import type { AnyResourceDef } from './registry'
	import ResourceFormSections from './ResourceFormSections.svelte'

	let { def }: { def: AnyResourceDef } = $props()

	// The screen keys this component by resource, so the first definition is the only one
	const form = untrack(() => createRecordForm(def))
	const sections = untrack(() => formSections(def, 'create'))
	// After the defaults and derive, so only what the user enters counts
	const unsaved = new UnsavedChangesGuard(() => form.values)
	unsaved.reset()

	const recordDef = $derived(def.record!)
	const noun = $derived(recordDef.noun())
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
</script>

<PageMeta title={m.page_title_db_new({ type: noun })} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.db_new_title({ noun })}>
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={`/database/${def.name}`}>
				{m.db_detail_back()}
			</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="element-ghost" {element} size="small" onclick={save} disabled={form.saving}>
				{form.saving ? m.action_saving() : m.action_save()}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	<ResourceFormSections {form} {sections} record={null} {element} />
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
