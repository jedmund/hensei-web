import { proxy } from "valtio"

const emptyJob: Job = {
  id: "-1",
  row: "",
  ml: false,
  order: 0,
  name: {
    en: "",
    ja: "",
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
    raid: Raid | undefined
    element: number
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
}

export const initialAppState: AppState = {
  party: {
    id: undefined,
    editable: false,
    detailsVisible: false,
    name: undefined,
    description: undefined,
    job: emptyJob,
    raid: undefined,
    element: 0,
    extra: false,
    user: undefined,
    favorited: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
}

export const appState = proxy(initialAppState)
