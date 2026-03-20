import { sidebar } from '$lib/stores/sidebar.svelte'
import JobSelectionSidebar from '$lib/components/sidebar/JobSelectionSidebar.svelte'
import JobSkillSelectionSidebar from '$lib/components/sidebar/JobSkillSelectionSidebar.svelte'
import JobAccessorySelectionSidebar from '$lib/components/sidebar/JobAccessorySelectionSidebar.svelte'
import type { Job, JobSkill, JobAccessory } from '$lib/types/api/entities'
import type { JobSkillList } from '$lib/types/api/party'
import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'
import * as m from '$lib/paraglide/messages'

type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

interface JobSelectionOptions {
	currentJobId?: string | undefined
	onSelectJob?: ((job: Job) => void) | undefined
	element?: ElementType
}

export interface SkillFilterState {
	searchQuery: string
	skillCategory: number
}

interface JobSkillSelectionOptions {
	job?: Job | undefined
	currentSkills?: JobSkillList | undefined
	targetSlot: number
	initialSearchQuery?: string
	initialSkillCategory?: number
	onSelectSkill?: ((skill: JobSkill, filterState: SkillFilterState) => void) | undefined
	onRemoveSkill?: (() => void) | undefined
}

export function openJobSelectionSidebar(options: JobSelectionOptions) {
	const { currentJobId, onSelectJob, element } = options

	sidebar.openWithComponent(
		'Select Job',
		JobSelectionSidebar,
		{
			currentJobId,
			element,
			onSelectJob: (job: Job) => {
				onSelectJob?.(job)
				sidebar.close()
			}
		},
		false // scrollable = false
	)
}

export function openJobSkillSelectionSidebar(options: JobSkillSelectionOptions) {
	const { job, currentSkills, targetSlot, initialSearchQuery, initialSkillCategory, onSelectSkill, onRemoveSkill } = options

	sidebar.openWithComponent(
		`Select Skill - Slot ${targetSlot + 1}`,
		JobSkillSelectionSidebar,
		{
			job,
			currentSkills,
			targetSlot,
			initialSearchQuery,
			initialSkillCategory,
			onSelectSkill: (skill: JobSkill, filterState: SkillFilterState) => {
				onSelectSkill?.(skill, filterState)
			},
			onRemoveSkill: () => {
				onRemoveSkill?.()
				sidebar.close()
			}
		},
		false // scrollable = false
	)
}

interface JobAccessorySelectionOptions {
	job?: Job | undefined
	currentAccessory?: JobAccessory | undefined
	onSelectAccessory?: ((accessory: JobAccessory) => void) | undefined
	onRemoveAccessory?: (() => void) | undefined
}

export function openJobAccessorySelectionSidebar(options: JobAccessorySelectionOptions) {
	const { job, currentAccessory, onSelectAccessory, onRemoveAccessory } = options

	const typeName = job?.accessoryType ? getAccessoryTypeName(job.accessoryType) : 'Accessory'

	sidebar.openWithComponent(
		m.party_job_select_accessory({ type: typeName }),
		JobAccessorySelectionSidebar,
		{
			job,
			currentAccessory,
			onSelectAccessory: (accessory: JobAccessory) => {
				onSelectAccessory?.(accessory)
				sidebar.close()
			},
			onRemoveAccessory: () => {
				onRemoveAccessory?.()
				sidebar.close()
			}
		},
		false // scrollable = false
	)
}

export function closeJobSidebar() {
	sidebar.close()
}
