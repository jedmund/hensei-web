<script lang="ts">
	// A gun's bullet slots, in order
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'

	let { record }: { record: Weapon } = $props()
</script>

{#each record.bulletSlots ?? [] as slotType, i (i)}
	<DetailItem
		label={m.db_weapons_field_bullet_slot({ n: i + 1 })}
		value={BULLET_TYPES[slotType] ?? 'Unknown'}
	/>
{/each}
