<script lang="ts">
	// The detail's Key Slot Unlocks row: each slot's unlock uncap as stars
	import * as m from '$lib/paraglide/messages'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import type { WeaponSeries } from '$lib/types/api/weaponSeries'

	let { record }: { record: Pick<WeaponSeries, 'keySlotMinUncaps'> } = $props()
</script>

<ul class="slots">
	{#each record.keySlotMinUncaps ?? [] as level, slot (slot)}
		<li>
			<span class="slot">{m.db_weapon_series_key_slot({ slot: String(slot + 1) })}</span>
			<UncapIndicator type="weapon" uncapLevel={level} flb ulb size="small" />
		</li>
	{/each}
</ul>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.slots {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: spacing.$unit-half;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.slot {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}
</style>
