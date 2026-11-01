<script lang="ts">
	// A form's sections, generated from its definition: an input per shown
	// field, and a section only while any of its fields shows. The edit and
	// new pages draw their forms with it.
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import type { FormSection } from './form'
	import FormField from './inputs/FormField.svelte'
	import type { ElementName } from './inputs/types'
	import type { RecordForm } from './recordForm.svelte'

	// The registry boundary is untyped: each input reads its own record type
	/* eslint-disable @typescript-eslint/no-explicit-any */
	interface Props {
		form: RecordForm<any, any>
		sections: FormSection<any, any>[]
		/** The record being edited; null on the new page */
		record: unknown
		element: ElementName | undefined
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */

	let { form, sections, record, element }: Props = $props()
</script>

<section class="details">
	{#each sections as { section, fields } (section.id)}
		{@const shown = fields.filter((field) => form.shown(field))}
		{#if shown.length}
			<DetailsContainer title={section.title()}>
				{#each shown as field (field.key)}
					<FormField {field} {form} {record} {element} />
				{/each}
			</DetailsContainer>
		{/if}
	{/each}
</section>

<style lang="scss">
	@use '$src/themes/database' as database;

	.details {
		@include database.details;
	}
</style>
