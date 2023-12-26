import { proxy } from 'valtio'
import { JobSkillObject, ResponseStatus } from '~types'
import { GroupedWeaponKeys } from './groupWeaponKeys'

const emptyJob: Job = {
  id: '-1',
  granblue_id: '-1',
  row: '',
  master_level: false,
  ultimate_mastery: false,
  order: 0,
  name: {
    en: '',
    ja: '',
  },
  proficiency: {
    proficiency1: 0,
    proficiency2: 0,
  },
  accessory: false,
  accessory_type: 0,
}

const emptyJobAccessory: JobAccessory = {
  id: '-1',
  granblue_id: '-1',
  job: emptyJob,
  name: {
    en: '',
    ja: '',
  },
  rarity: 0,
}

interface AppState {
  [key: string]: any

  party: {
    id: string | undefined
    shortcode: string | undefined
    editable: boolean
    detailsVisible: boolean
    name: string | undefined
    description: string | undefined
    job: Job
    jobSkills: JobSkillObject
    accessory: JobAccessory
    raid: Raid | undefined
    element: number
    fullAuto: boolean
    autoGuard: boolean
    autoSummon: boolean
    chargeAttack: boolean
    clearTime: number
    buttonCount?: number
    turnCount?: number
    chainCount?: number
    extra: boolean
    guidebooks: GuidebookList
    user: User | undefined
    favorited: boolean
    remix: boolean
    remixes: Party[]
    visibility: number
    sourceParty?: Party
    created_at: string
    updated_at: string
  }
  grid: {
    weapons: {
      mainWeapon: GridWeapon | undefined
      allWeapons: GridArray<GridWeapon>
    }
    summons: {
      mainSummon: GridSummon | undefined
      friendSummon: GridSummon | undefined
      allSummons: GridArray<GridSummon>
    }
    characters: GridArray<GridCharacter>
  }
  search: {
    recents: {
      characters: Character[]
      weapons: Weapon[]
      summons: Summon[]
    }
  }
  raidGroups: RaidGroup[]
  jobs: Job[]
  jobSkills: JobSkill[]
  weaponKeys: GroupedWeaponKeys
  version?: AppUpdate
  status?: ResponseStatus
}

export const initialAppState: AppState = {
  party: {
    id: undefined,
    shortcode: '',
    editable: false,
    detailsVisible: false,
    name: undefined,
    description: undefined,
    job: emptyJob,
    jobSkills: {
      0: undefined,
      1: undefined,
      2: undefined,
      3: undefined,
    },
    accessory: emptyJobAccessory,
    raid: undefined,
    fullAuto: false,
    autoGuard: false,
    autoSummon: false,
    chargeAttack: true,
    clearTime: 0,
    buttonCount: undefined,
    turnCount: undefined,
    chainCount: undefined,
    element: 0,
    extra: false,
    guidebooks: {
      0: undefined,
      1: undefined,
      2: undefined,
    },
    user: undefined,
    favorited: false,
    remix: false,
    remixes: [],
    visibility: 1,
    sourceParty: undefined,
    created_at: '',
    updated_at: '',
  },
  grid: {
    weapons: {
      mainWeapon: undefined,
      allWeapons: {},
    },
    summons: {
      mainSummon: undefined,
      friendSummon: undefined,
      allSummons: {},
    },
    characters: {},
  },
  search: {
    recents: {
      characters: [],
      weapons: [],
      summons: [],
    },
  },
  raidGroups: [],
  jobs: [],
  jobSkills: [],
  weaponKeys: {
    pendulum: [],
    chain: [],
    teluma: [],
    gauph: [],
    emblem: [],
    providence: [],
  },
  version: {
    version: '0.0',
    update_type: '',
    updated_at: '',
  },
  status: undefined,
}

export const appState = proxy(initialAppState)
