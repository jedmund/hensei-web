<script lang="ts">
	// The uncap stars on the forms, following the FLB, ULB and transcendence checkboxes
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import WeaponUncapIndicator from '$lib/features/database/weapons/detail/WeaponUncapIndicator.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'

	let { field, form }: InputProps = $props()

	const uncap = $derived({
		flb: form.values.flb === true,
		ulb: form.values.ulb === true,
		transcendence: form.values.transcendence === true
	})
</script>

<DetailItem label={field.label()}>
	<WeaponUncapIndicator record={{ uncap }} />
</DetailItem>
