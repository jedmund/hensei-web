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
  localId: string | null
  editKey: string | null
  name: string
  description: string
  shortcode: string
  user: User | null
  editable: boolean
  element?: GranblueElement
  grid: Grid
  details: {
    extra: boolean
    fullAuto: boolean
    autoGuard: boolean
    autoSummon: boolean
    chargeAttack: boolean | null
    clearTime: number | null
    buttonCount: number | null
    turnCount: number | null
    chainCount: number | null
  }
  protagonist: {
    job?: Job
    skills: JobSkillList | null
    masterLevel: number | null
    ultimateMastery: number | null
    accessory: JobAccessory | null
  }
  social: {
    favorited: boolean
    sourceParty: Party | null
    remix: boolean
    remixes: Party[]
  }
  raid: Raid | null
  guidebooks: GuidebookList
  timestamps: {
    createdAt: string
    updatedAt: string
  }
}
