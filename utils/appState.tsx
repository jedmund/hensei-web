import { proxy } from "valtio";

interface AppState {
    [key: string]: any
    
    party: {
        id: string | undefined,
        editable: boolean,
        name: {
            en: string,
            jp: string
        } | undefined,
        description: string | undefined,
        raid: Raid | undefined,
        element: number,
        extra: boolean
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
        sourceItem: GridCharacter | GridWeapon | GridSummon | undefined
    }
}

export const initialAppState: AppState = {
    party: {
        id: undefined,
        editable: false,
        name: undefined,
        description: undefined,
        raid: undefined,
        element: 0,
        extra: false
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
        sourceItem: undefined
    }
}

export const appState = proxy(initialAppState)