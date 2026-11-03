<script lang="ts">
	// One row of uncap stars per key slot, as many as the series' Weapon Key Slots.
	// No stars saves as 0 (always open; see keySlotMinUncaps.ts)
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import { keySlotCount } from '../keySlotMinUncaps'

	let { field, form }: InputProps = $props()

	const values = $derived((form.values[field.key] ?? []) as (number | null)[])
	const slots = $derived(Array.from({ length: keySlotCount(form.values) }, (_, i) => i))

	function setAt(slot: number, level: number) {
		const list = Array.from({ length: slots.length }, (_, i) => values[i] ?? 0)
		list[slot] = level
		form.set(field.key, list)
	}
</script>

{#each slots as slot (slot)}
	<DetailItem
		label={m.db_weapon_series_key_slot({ slot: String(slot + 1) })}
		sublabel={slot === 0 ? field.sublabel?.() : undefined}
		error={form.errors[`${field.key}.${slot}`] ?? (slot === 0 ? form.errors[field.key] : undefined)}
	>
		<UncapIndicator
			type="weapon"
			uncapLevel={values[slot] ?? 0}
			flb
			ulb
			editable
			updateUncap={(level) => setAt(slot, level)}
		/>
	</DetailItem>
{/each}
