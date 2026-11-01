<script lang="ts">
	// Whole numbers typed as a comma-separated list. The text is the input's
	// own, so a trailing comma survives typing; the form holds the numbers
	// (anything that isn't one stays in, as NaN, for validation to report)
	import { untrack } from 'svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from './types'

	let { field, form }: InputProps = $props()

	const format = (list: unknown) => (Array.isArray(list) ? list.join(', ') : '')
	let text = $state(untrack(() => format(form.values[field.key])))

	function set(next: string) {
		text = next
		const list = next
			.split(',')
			.map((part) => part.trim())
			.filter((part) => part !== '')
			.map(Number)
		form.set(field.key, list)
	}
</script>

<DetailItem
	label={field.label()}
	sublabel={field.sublabel?.()}
	error={form.error(field.key)}
	placeholder={field.form ? field.form.placeholder?.() : undefined}
	editable
	type="text"
	bind:value={() => text, set}
/>
