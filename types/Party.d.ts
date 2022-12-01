import { JobSkillObject } from "~types"

interface Party {
  id: string
  name: string
  description: string
  raid: Raid
  job: Job
  job_skills: JobSkillObject
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
