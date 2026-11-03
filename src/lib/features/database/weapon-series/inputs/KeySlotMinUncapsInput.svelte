<script lang="ts">
	// One uncap level per key slot, as many as the series' Weapon Key Slots.
	// A blank slot saves as 0 (always open; see keySlotMinUncaps.ts)
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import { keySlotCount } from '../keySlotMinUncaps'

	let { field, form }: InputProps = $props()

	const values = $derived((form.values[field.key] ?? []) as (number | null)[])
	const slots = $derived(Array.from({ length: keySlotCount(form.values) }, (_, i) => i))

	function setAt(slot: number, next: unknown) {
		const list = Array.from({ length: slots.length }, (_, i) => values[i] ?? null)
		list[slot] = next === '' || next === undefined || next === null ? null : Number(next)
		form.set(field.key, list)
	}
</script>

{#each slots as slot (slot)}
	<DetailItem
		label={m.db_weapon_series_key_slot({ slot: String(slot + 1) })}
		sublabel={slot === 0 ? field.sublabel?.() : undefined}
		error={form.errors[`${field.key}.${slot}`] ?? (slot === 0 ? form.errors[field.key] : undefined)}
		editable
		type="number"
		bind:value={() => values[slot] ?? null, (v) => setAt(slot, v)}
	/>
{/each}
