type JobSkillObject = {
  [key: number]: JobSkill | undefined
  0: JobSkill | undefined
  1: JobSkill | undefined
  2: JobSkill | undefined
  3: JobSkill | undefined
}

interface Party {
  id: string
  name: string
  description: string
  raid: Raid
  full_auto: boolean
  auto_guard: boolean
  charge_attack: boolean
  clear_time: number
  button_count?: number
  turn_count?: number
  chain_count?: number
  job: Job
  job_skills: JobSkillObject
  accessory: JobAccessory
  shortcode: string
  extra: boolean
  favorited: boolean
  characters: Array<GridCharacter>
  weapons: Array<GridWeapon>
  summons: Array<GridSummon>
  user: User
  created_at: string
  updated_at: string
}
