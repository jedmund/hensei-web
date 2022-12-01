interface Party {
  id: string
  name: string
  description: string
  raid: Raid
  job: Job
  job_skills: {
    [key: number]: JobSkill
    1: JobSkill
    2: JobSkill
    3: JobSkill
  }
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
