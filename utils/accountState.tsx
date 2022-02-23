import { proxy } from "valtio";

interface AccountState {
    [key: string]: any
    
    account: {
        authorized: boolean,
        language: 'en' | 'jp'
    }
}

export const initialAccountState: AccountState = {
    account: {
        authorized: false,
        language: 'en'
    }
}

export const accountState = proxy(initialAccountState)
