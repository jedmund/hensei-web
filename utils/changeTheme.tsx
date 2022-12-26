import { useTheme } from 'next-themes'
import { accountState } from '~utils/accountState'

export default function changeTheme() {
  const { theme, setTheme } = useTheme()
  if (accountState.account.user) {
    setTheme(accountState.account.user.theme)
  }
}
