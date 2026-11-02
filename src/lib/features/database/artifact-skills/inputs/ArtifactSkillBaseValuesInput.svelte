<script lang="ts">
	// One number per quality tier. Blank qualities hold null in the form;
	// the field trims trailing ones when it saves (see baseValues.ts)
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import { QUALITIES } from '../baseValues'

	let { field, form }: InputProps = $props()

	const values = $derived((form.values[field.key] ?? []) as (number | null)[])

	function setAt(index: number, next: unknown) {
		const list = Array.from(
			{ length: Math.max(values.length, index + 1) },
			(_, i) => values[i] ?? null
		)
		list[index] = next === '' || next === undefined || next === null ? null : Number(next)
		form.set(field.key, list)
	}
</script>

{#each Array.from({ length: QUALITIES }, (_, i) => i) as index (index)}
	<DetailItem
		label={m.db_artifact_skills_quality({ quality: String(index + 1) })}
		sublabel={index === 0 ? field.sublabel?.() : undefined}
		error={form.errors[`${field.key}.${index}`] ??
			(index === 0 ? form.errors[field.key] : undefined)}
		editable
		type="number"
		bind:value={() => values[index] ?? null, (v) => setAt(index, v)}
	/>
{/each}
