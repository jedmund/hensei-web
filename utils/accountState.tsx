import { proxy } from "valtio";

interface AccountState {
    [key: string]: any
    
    account: {
        authorized: boolean,
        language: 'en' | 'jp',
        user: {
            id: string,
            username: string,
            picture: string,
            element: string,
        } | undefined
    }
}

export const initialAccountState: AccountState = {
    account: {
        authorized: false,
        language: 'en',
        user: undefined
    }
}

export const accountState = proxy(initialAccountState)
