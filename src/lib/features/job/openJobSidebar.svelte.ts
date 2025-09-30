import { sidebar } from '$lib/stores/sidebar.svelte'
import JobSelectionSidebar from '$lib/components/sidebar/JobSelectionSidebar.svelte'
import JobSkillSelectionSidebar from '$lib/components/sidebar/JobSkillSelectionSidebar.svelte'
import type { Job, JobSkill } from '$lib/types/api/entities'
import type { JobSkillList } from '$lib/types/api/party'

interface JobSelectionOptions {
	currentJobId?: string
	onSelectJob?: (job: Job) => void
}

interface JobSkillSelectionOptions {
	job?: Job
	currentSkills?: JobSkillList
	targetSlot: number
	onSelectSkill?: (skill: JobSkill) => void
	onRemoveSkill?: () => void
}

export function openJobSelectionSidebar(options: JobSelectionOptions) {
	const { currentJobId, onSelectJob } = options

	sidebar.openWithComponent(
		'Select Job',
		JobSelectionSidebar,
		{
			currentJobId,
			onSelectJob: (job: Job) => {
				onSelectJob?.(job)
				sidebar.close()
			}
		},
		false // scrollable = false
	)
}

export function openJobSkillSelectionSidebar(options: JobSkillSelectionOptions) {
	const { job, currentSkills, targetSlot, onSelectSkill, onRemoveSkill } = options

	sidebar.openWithComponent(
		`Select Skill - Slot ${targetSlot + 1}`,
		JobSkillSelectionSidebar,
		{
			job,
			currentSkills,
			targetSlot,
			onSelectSkill: (skill: JobSkill) => {
				onSelectSkill?.(skill)
				sidebar.close()
			},
			onRemoveSkill: () => {
				onRemoveSkill?.()
				sidebar.close()
			}
		},
		false // scrollable = false
	)
}

export function closeJobSidebar() {
	sidebar.close()
}