
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { JobSkill } from '$lib/types/api/entities'
	import SkillTypeBadge from '$lib/components/database/SkillTypeBadge.svelte'

	const { row }: Cell = $props()

	const skill = row as JobSkill
</script>

<SkillTypeBadge {skill} />
