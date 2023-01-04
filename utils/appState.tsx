import { proxy } from 'valtio'
import { JobSkillObject } from '~types'
import { GroupedWeaponKeys } from './groupWeaponKeys'

const emptyJob: Job = {
  id: '-1',
  row: '',
  ml: false,
  order: 0,
  name: {
    en: '',
    ja: '',
  },
  proficiency: {
    proficiency1: 0,
    proficiency2: 0,
  },
}

interface AppState {
  [key: string]: any

  party: {
    id: string | undefined
    editable: boolean
    detailsVisible: boolean
    name: string | undefined
    description: string | undefined
    job: Job
    jobSkills: JobSkillObject
    raid: Raid | undefined
    element: number
    fullAuto: boolean
    autoGuard: boolean
    chargeAttack: boolean
    clearTime: number
    buttonCount?: number
    turnCount?: number
    chainCount?: number
    extra: boolean
    user: User | undefined
    favorited: boolean
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
  raids: Raid[]
  jobs: Job[]
  jobSkills: JobSkill[]
  weaponKeys: GroupedWeaponKeys
}

export const initialAppState: AppState = {
  party: {
    id: undefined,
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
    raid: undefined,
    fullAuto: false,
    autoGuard: false,
    chargeAttack: true,
    clearTime: 0,
    buttonCount: undefined,
    turnCount: undefined,
    chainCount: undefined,
    element: 0,
    extra: false,
    user: undefined,
    favorited: false,
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
  raids: [],
  jobs: [],
  jobSkills: [],
  weaponKeys: {
    pendulum: [],
    chain: [],
    teluma: [],
    gauph: [],
    emblem: [],
  },
}

export const appState = proxy(initialAppState)
