export type SearchableObject = Character | Weapon | Summon | JobSkill
export type SearchableObjectArray = (Character | Weapon | Summon | JobSkill)[]
export type JobSkillObject = {
  [key: number]: JobSkill | undefined
  0: JobSkill | undefined
  1: JobSkill | undefined
  2: JobSkill | undefined
  3: JobSkill | undefined
}

export type PaginationObject = {
  count: number
  totalPages: number
  perPage: number
}
