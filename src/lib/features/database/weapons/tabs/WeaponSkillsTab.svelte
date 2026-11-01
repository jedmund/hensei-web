<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import WeaponSkillList from '$lib/components/weapon/WeaponSkillList.svelte'
	import type { Weapon } from '$lib/api/adapters/weapon.adapter'
	import type { RecordTabProps } from '$lib/features/database/schema/types'

	let { record }: RecordTabProps<Weapon> = $props()

	const skills = $derived(record.weaponSkills ?? [])
</script>

<div class="skills-tab">
	{#if !skills.length}
		<div class="empty">{m.weapon_skills_empty()}</div>
	{:else}
		<WeaponSkillList {skills} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.empty {
		text-align: center;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);
	}
</style>
