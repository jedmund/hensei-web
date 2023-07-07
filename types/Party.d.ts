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
  localId?: string
  name: string
  description: string
  shortcode: string
  user?: User
  editable: boolean
  element?: GranblueElement
  grid: Grid
  details: {
    extra: boolean
    fullAuto: boolean
    autoGuard: boolean
    autoSummon: boolean
    chargeAttack: boolean
    clearTime: number
    buttonCount?: number
    turnCount?: number
    chainCount?: number
  }
  protagonist: {
    job: Job
    skills: JobSkillList
    masterLevel?: number
    ultimateMastery?: number
    accessory: JobAccessory
  }
  social: {
    favorited: boolean
    sourceParty?: Party
    remix: boolean
    remixes: Party[]
  }
  raid?: Raid
  guidebooks: GuidebookList
  timestamps: {
    createdAt: string
    updatedAt: string
  }
}
