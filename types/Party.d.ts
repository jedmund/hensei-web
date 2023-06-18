type JobSkillList = {
  [key: number]: JobSkill | undefined
  0: JobSkill | undefined
  1: JobSkill | undefined
  2: JobSkill | undefined
  3: JobSkill | undefined
}

type GuidebookList = {
  [key: number]: Guidebook | undefined
  0: Guidebook | undefined
  1: Guidebook | undefined
  2: Guidebook | undefined
}

interface Party {
  id: string
  name: string
  description: string
  raid: Raid
  full_auto: boolean
  auto_guard: boolean
  auto_summon: boolean
  charge_attack: boolean
  clear_time: number
  button_count?: number
  turn_count?: number
  chain_count?: number
  source_party?: Party
  job: Job
  master_level?: number
  ultimate_mastery?: number
  job_skills: JobSkillList
  accessory: JobAccessory
  shortcode: string
  extra: boolean
  guidebooks: GuidebookList
  favorited: boolean
  characters: Array<GridCharacter>
  weapons: Array<GridWeapon>
  summons: Array<GridSummon>
  user: User
  local_id?: string
  remix: boolean
  remixes: Party[]
  created_at: string
  updated_at: string
}
