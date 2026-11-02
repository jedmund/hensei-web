<script lang="ts">
	// The family's skill icon in the families list (cycles through its variants)
	import WeaponSkillIcon from '$lib/components/database/WeaponSkillIcon.svelte'
	import type { WeaponSkillFamilySummary } from '$lib/types/api/weaponSkillFamily'

	let { row }: { row: WeaponSkillFamilySummary } = $props()
</script>

{#if row.iconStems.length > 0}
	<WeaponSkillIcon iconStems={row.iconStems} size={40} />
{/if}
