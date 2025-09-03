'use client'

import { useEffect } from 'react'
import { getCookie } from 'cookies-next'
import { accountState } from '~utils/accountState'
import { setHeaders } from '~utils/userToken'

export default function AccountStateInitializer() {
  useEffect(() => {
    const accountCookie = getCookie('account')
    const userCookie = getCookie('user')

    if (accountCookie && userCookie) {
      try {
        const accountData = JSON.parse(accountCookie as string)
        const userData = JSON.parse(userCookie as string)

        if (accountData && accountData.token) {
          console.log(`Logged in as user "${accountData.username}"`)
          
          // Set headers for API calls
          setHeaders()
          
          // Update account state
          accountState.account.authorized = true
          accountState.account.user = {
            id: accountData.userId,
            username: accountData.username,
            role: accountData.role,
            granblueId: '',
            avatar: {
              picture: userData.avatar.picture,
              element: userData.avatar.element,
            },
            gender: userData.gender,
            language: userData.language,
            theme: userData.theme,
            bahamut: userData.bahamut || false,
          }
        }
      } catch (error) {
        console.error('Error parsing account cookies:', error)
      }
    }
  }, [])

  return null
}