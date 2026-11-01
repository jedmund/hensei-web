<script lang="ts">
	// The edit form's variants: each opens the variant dialog, which saves on
	// its own (variants have their own endpoint), so the list reads the series
	// query the dialog refreshes rather than the form's values
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { withInitialData } from '$lib/query/ssr'
	import Button from '$lib/components/ui/Button.svelte'
	import VariantModal from '$lib/features/database/weapon-series/VariantModal.svelte'
	import VariantRow from '$lib/features/database/weapon-series/VariantRow.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { WeaponSeries } from '$lib/types/api/weaponSeries'
	import type { WeaponSeriesVariant } from '$lib/types/api/weaponSeriesVariant'

	let props: InputProps = $props()

	// On the edit form only (`form: { create: false }`), so there's a record
	const record = $derived(props.record as WeaponSeries)

	const query = createQuery(() => ({
		...entityQueries.weaponSeries(record.slug),
		...withInitialData(record)
	}))
	const variants = $derived(query.data?.variants ?? [])

	let open = $state(false)
	let editing = $state<WeaponSeriesVariant | null>(null)

	function edit(variant: WeaponSeriesVariant | null) {
		editing = variant
		open = true
	}
</script>

<div class="variants">
	{#each variants as variant (variant.id)}
		<VariantRow {variant} onclick={() => edit(variant)} />
	{:else}
		<p class="empty">{m.db_weapon_series_variants_empty()}</p>
	{/each}
	<div class="add">
		<Button variant="ghost" size="small" leftIcon="plus" onclick={() => edit(null)}>
			{m.db_weapon_series_variants_add()}
		</Button>
	</div>
</div>

<VariantModal bind:open seriesId={record.id} variant={editing} />

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.variants {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.empty {
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
	}

	.add {
		display: flex;
		justify-content: flex-end;
	}
</style>
