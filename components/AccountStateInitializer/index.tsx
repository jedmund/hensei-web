'use client'

import { useEffect, useRef } from 'react'
import { getCookie } from 'cookies-next'
import { accountState } from '~utils/accountState'
import { setHeaders } from '~utils/userToken'

interface InitialAuthData {
  account: {
    token: string
    userId: string
    username: string
    role: number
  }
  user: {
    avatar: {
      picture: string
      element: string
    }
    gender: number
    language: string
    theme: string
    bahamut?: boolean
  }
}

interface AccountStateInitializerProps {
  initialAuthData?: InitialAuthData | null
}

export default function AccountStateInitializer({ initialAuthData }: AccountStateInitializerProps) {
  const initialized = useRef(false)
  
  // Initialize synchronously on first render if we have server data
  if (initialAuthData && !initialized.current) {
    initialized.current = true
    const { account: accountData, user: userData } = initialAuthData
    
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
  
  useEffect(() => {
    // Only run client-side cookie reading if no server data
    if (initialized.current) return
    
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
          
          initialized.current = true
        }
      } catch (error) {
        console.error('Error parsing account cookies:', error)
      }
    }
  }, [])

  return null
}