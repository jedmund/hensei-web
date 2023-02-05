import { proxy } from 'valtio'

export type UserState = {
  id: string
  granblueId: string
  username: string
  avatar: {
    picture: string
    element: string
  }
  gender: number
  language: string
  theme: string
}

interface AccountState {
  [key: string]: any

  account: {
    authorized: boolean
    user: UserState | undefined
  }
}

export const initialAccountState: AccountState = {
  account: {
    authorized: false,
    user: undefined,
  },
}

export const accountState = proxy(initialAccountState)
