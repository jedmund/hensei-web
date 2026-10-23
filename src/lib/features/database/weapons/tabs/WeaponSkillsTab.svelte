<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import WeaponSkillList from '$lib/components/weapon/WeaponSkillList.svelte'
	import type { WeaponSkill } from '$lib/types/api/entities'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity shape from API
		weapon: any
	}

	let { weapon }: Props = $props()

	const skills = $derived((weapon?.weaponSkills ?? []) as WeaponSkill[])
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

	.skills-tab {
		padding: spacing.$unit-2x;
	}

	.empty {
		text-align: center;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);
	}
</style>
