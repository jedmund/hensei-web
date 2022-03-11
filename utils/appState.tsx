import { proxy } from "valtio";

interface AppState {
    [key: string]: any
    
    party: {
        id: string | undefined,
        editable: boolean,
        detailsVisible: boolean,
        name: string | undefined,
        description: string | undefined,
        raid: Raid | undefined,
        element: number,
        extra: boolean,
        user: User | undefined,
        favorited: boolean
    },
    grid: {
        weapons: {
            mainWeapon: GridWeapon | undefined,
            allWeapons: GridArray<GridWeapon>
        },
        summons: {
            mainSummon: GridSummon | undefined,
            friendSummon: GridSummon | undefined,
            allSummons: GridArray<GridSummon>
        },
        characters: GridArray<GridCharacter>
    },
    search: {
        recents: {
            characters: Character[]
            weapons: Weapon[]
            summons: Summon[]
        }
    },
    raids: Raid[]
}

export const initialAppState: AppState = {
    party: {
        id: undefined,
        editable: false,
        detailsVisible: false,
        name: undefined,
        description: undefined,
        raid: undefined,
        element: 0,
        extra: false,
        user: undefined,
        favorited: false
    },
    grid: {
        weapons: {
            mainWeapon: undefined,
            allWeapons: {}
        },
        summons: {
            mainSummon: undefined,
            friendSummon: undefined,
            allSummons: {}
        },
        characters: {}
    },
    search: {
        recents: {
            characters: [],
            weapons: [],
            summons: []
        }
    },
    raids: []
}

export const appState = proxy(initialAppState)