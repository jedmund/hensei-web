import { proxy } from "valtio";

interface AccountState {
    [key: string]: any
    
    account: {
        authorized: boolean
        user: {
            id: string
            username: string
            picture: string
            element: string
            gender: number
        } | undefined
    }
}

export const initialAccountState: AccountState = {
    account: {
        authorized: false,
        user: undefined
    }
}

export const accountState = proxy(initialAccountState)
