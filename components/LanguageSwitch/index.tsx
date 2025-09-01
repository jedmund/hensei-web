'use client'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { setCookie } from 'cookies-next'
import { retrieveLocaleCookies } from '~utils/retrieveCookies'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import styles from './index.module.scss'

interface Props extends SwitchPrimitive.SwitchProps {}

export const LanguageSwitch = React.forwardRef<HTMLButtonElement, Props>(
  function LanguageSwitch(
    { children }: PropsWithChildren<Props>,
    forwardedRef
  ) {
    // Router and locale data
    const router = useRouter()
    const pathname = usePathname()
    const localeData = retrieveLocaleCookies()

    // State
    const [languageChecked, setLanguageChecked] = useState(false)

    // Hooks
    useEffect(() => {
      setLanguageChecked(localeData === 'ja' ? true : false)
    }, [localeData])

    function changeLanguage(value: boolean) {
      const language = value ? 'ja' : 'en'
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 120)

      setCookie('NEXT_LOCALE', language, { path: '/', expires: expiresAt })
      router.refresh()
    }

    return (
      <SwitchPrimitive.Root
        className={styles.languageSwitch}
        onCheckedChange={changeLanguage}
        checked={languageChecked}
        ref={forwardedRef}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
        <span className={styles.left}>JP</span>
        <span className={styles.right}>EN</span>
      </SwitchPrimitive.Root>
    )
  }
)

export default LanguageSwitch
