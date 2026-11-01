<script lang="ts">
	// A weapon series' variants and the flags each overrides
	import * as m from '$lib/paraglide/messages'
	import VariantRow from '$lib/features/database/weapon-series/VariantRow.svelte'
	import type { WeaponSeries } from '$lib/types/api/weaponSeries'

	let { record }: { record: WeaponSeries } = $props()
</script>

{#each record.variants ?? [] as variant (variant.id)}
	<VariantRow {variant} />
{:else}
	<p class="empty">{m.db_weapon_series_variants_empty()}</p>
{/each}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.empty {
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
		padding-bottom: spacing.$unit-2x;
	}
</style>
