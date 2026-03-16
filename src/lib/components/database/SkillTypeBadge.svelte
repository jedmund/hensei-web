
<script lang="ts">
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillCategoryName, getSkillCategoryColor } from '$lib/utils/jobUtils'

	interface Props {
		skill: JobSkill
	}

	let { skill }: Props = $props()

	const categoryName = $derived(getSkillCategoryName(skill))
</script>

<span class="badge" style="background: {getSkillCategoryColor(skill)}">
	{categoryName}
</span>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		color: white;
		white-space: nowrap;
	}
</style>
