<script lang="ts">
	// The sticker's slug: typed on the create form, then fixed, since it names
	// the sticker's image files
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'

	let { field, form }: InputProps = $props()

	const value = $derived((form.values[field.key] ?? '') as string)
</script>

{#if form.mode === 'create'}
	<DetailItem
		label={field.label()}
		error={form.error(field.key)}
		placeholder={field.form ? field.form.placeholder?.() : undefined}
		width={field.form ? field.form.width : undefined}
		editable
		type="text"
		bind:value={() => value, (v: unknown) => form.set(field.key, v)}
	/>
{:else}
	<DetailItem label={field.label()} {value} />
{/if}
