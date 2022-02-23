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

export default proxy(state)