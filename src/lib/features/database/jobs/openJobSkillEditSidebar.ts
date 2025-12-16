import { sidebar } from '$lib/stores/sidebar.svelte'
import JobSkillEditPane from './JobSkillEditPane.svelte'
import type { JobSkill } from '$lib/types/api/entities'

interface OpenJobSkillEditOptions {
	jobId: string
	skill?: JobSkill
	onSaved?: () => void
}

export function openJobSkillEditSidebar(options: OpenJobSkillEditOptions) {
	const { jobId, skill, onSaved } = options
	const title = skill ? 'Edit Skill' : 'New Skill'

	sidebar.openWithComponent(
		title,
		JobSkillEditPane,
		{
			jobId,
			skill,
			onSaved
		},
		{ scrollable: true }
	)
}
