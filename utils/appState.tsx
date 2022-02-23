import { proxy } from "valtio";

interface AppState {
    [key: string]: any
    
    party: {
        id: string | undefined,
        editable: boolean,
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