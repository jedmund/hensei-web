<script lang="ts">
	// Element-changeable weapons: the weapon ID for each element
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { ELEMENT_DISPLAY_ORDER, getElementLabel } from '$lib/utils/element'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'

	let { record }: { record: Weapon } = $props()
</script>

{#each ELEMENT_DISPLAY_ORDER as element (element)}
	<DetailItem label={getElementLabel(element)}>
		{record.elementVariantIds?.[String(element)] || '—'}
	</DetailItem>
{/each}
