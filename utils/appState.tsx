import { proxy } from 'valtio'
import { ResponseStatus } from '~types'
import { GroupedWeaponKeys } from './groupWeaponKeys'
import { elements } from '~utils/elements'

const nullElement = elements[0]

const emptyJob: Job = {
  id: '-1',
  granblueId: '-1',
  row: '',
  masterLevel: false,
  ultimateMastery: false,
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
  granblueId: '-1',
  job: emptyJob,
  name: {
    en: '',
    ja: '',
  },
  rarity: 0,
}

interface AppState {
  [key: string]: any

  party: Party
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
    id: '',
    shortcode: '',
    name: '',
    description: '',
    user: undefined,
    raid: undefined,
    editable: false,
    element: nullElement,
    protagonist: {
      job: emptyJob,
      skills: {
        0: undefined,
        1: undefined,
        2: undefined,
        3: undefined,
      },
      masterLevel: 0,
      ultimateMastery: 0,
      accessory: emptyJobAccessory,
    },
    details: {
      fullAuto: false,
      autoGuard: false,
      autoSummon: false,
      chargeAttack: true,
      extra: false,
      clearTime: 0,
      buttonCount: undefined,
      turnCount: undefined,
      chainCount: undefined,
    },
    guidebooks: {
      0: undefined,
      1: undefined,
      2: undefined,
    },
    social: {
      favorited: false,
      remix: false,
      remixes: [],
      sourceParty: undefined,
    },
    timestamps: {
      createdAt: '',
      updatedAt: '',
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
  },
  version: {
    version: '0.0',
    update_type: '',
    updated_at: '',
  },
  status: undefined,
}
// editable: false,
export const appState = proxy(initialAppState)
