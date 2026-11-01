<script lang="ts">
	// The uncap stars on the forms, following the uncap checkboxes
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import CharacterUncap from '$lib/features/database/characters/detail/CharacterUncap.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'

	let { field, form }: InputProps = $props()

	const record = $derived({
		special: form.values.special === true,
		uncap: {
			flb: form.values.flb === true,
			ulb: form.values.ulb === true,
			transcendence: form.values.transcendence === true,
			maxTranscendenceStage: (form.values.max_transcendence_stage as number | null) ?? 0
		}
	})
</script>

<DetailItem label={field.label()}>
	<CharacterUncap {record} />
</DetailItem>
