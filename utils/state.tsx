import { proxy } from "valtio";

interface State {
    app: {
        authenticated: boolean
    },
    party: {
        id: string | undefined,
        editable: boolean,
        element: number,
        extra: boolean
    },
    grid: {
        weapons: {
            mainWeapon: GridWeapon | undefined,
            allWeapons: GridWeapon[]
        },
        summons: {
            mainSummon: GridSummon | undefined,
            friendSummon: GridSummon | undefined,
            allSummons: GridSummon[]
        },
        characters: GridCharacter[]
    },
    search: {
        sourceItem: GridCharacter | GridWeapon | GridSummon | undefined
    }
}

const state: State = {
    app: {
        authenticated: false
    },
    party: {
        id: undefined,
        editable: false,
        element: 0,
        extra: false
    },
    grid: {
        weapons: {
            mainWeapon: undefined,
            allWeapons: Array<GridWeapon>()
        },
        summons: {
            mainSummon: undefined,
            friendSummon: undefined,
            allSummons: Array<GridSummon>()
        },
        characters: Array<GridCharacter>()
    },
    search: {
        sourceItem: undefined
    }
}

export default proxy(state)