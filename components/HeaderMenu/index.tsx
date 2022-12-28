import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { setCookie } from 'cookies-next'
import classNames from 'classnames'
import retrieveCookies from '~utils/retrieveCookies'

import Link from 'next/link'
import * as Switch from '@radix-ui/react-switch'

import AboutModal from '~components/AboutModal'
import AccountModal from '~components/AccountModal'
import ChangelogModal from '~components/ChangelogModal'
import RoadmapModal from '~components/RoadmapModal'
import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'

import './index.scss'

interface Props {
  authenticated: boolean
  open: boolean
  username?: string
  onClickOutside: () => void
  logout?: () => void
}

const HeaderMenu = (props: Props) => {
  // Setup
  const router = useRouter()
  const data: GranblueCookie | undefined = retrieveCookies()
  const { t } = useTranslation('common')

  // Refs
  const ref: React.RefObject<HTMLDivElement> = React.createRef()

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        ref.current &&
        event.target instanceof Element &&
        !ref.current.contains(event.target) &&
        props.open
      ) {
        props.onClickOutside()
      }
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [props.onClickOutside])

  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const locale = data?.locale
    setChecked(locale === 'ja' ? true : false)
  }, [data?.locale])

  function handleCheckedChange(value: boolean) {
    const language = value ? 'ja' : 'en'
    setCookie('NEXT_LOCALE', language, { path: '/' })
    router.push(router.asPath, undefined, { locale: language })
  }

  const menuClasses = classNames({
    Menu: true,
    auth: props.authenticated,
    open: props.open,
  })

  function authItems() {
    return (
      <nav>
          <div className="MenuGroup">
            <li className="MenuItem profile">
              <Link href={`/${accountData.username}` || ''} passHref>
                <div>
                  <span>{accountData.username}</span>
                  <img
                    alt={userData.picture}
                    className={`profile ${accountState.account.user?.element}`}
                    srcSet={`/profile/${accountState.account.user?.picture}.png, 
                      /profile/${userData.picture}@2x.png 2x`}
                    src={`/profile/${userData.picture}.png`}
                  />
                </div>
              </Link>
            </li>
            <li className="MenuItem">
              <Link href={`/saved` || ''}>{t('menu.saved')}</Link>
            </li>
          </div>
          <div className="MenuGroup">
            <li className="MenuItem">
              <Link href="/teams">{t('menu.teams')}</Link>
            </li>

            <li className="MenuItem disabled">
      <ul className={menuClasses}>
              <div>
                <span>{t('menu.guides')}</span>
                <i className="tag">{t('coming_soon')}</i>
              </div>
            </li>
          </div>
          <div className="MenuGroup">
            <AboutModal />
            <ChangelogModal />
            <RoadmapModal />
          </div>
          <div className="MenuGroup">
            <AccountModal
              username={accountState.account.user?.username}
              picture={accountState.account.user?.picture}
              gender={accountState.account.user?.gender}
              language={accountState.account.user?.language}
              theme={accountState.account.user?.theme}
            />
            <li className="MenuItem" onClick={props.logout}>
              <span>{t('menu.logout')}</span>
            </li>
          </div>
        </ul>
      </nav>
    )
  }

  function unauthItems() {
    return (
      <ul className={menuClasses}>
        <div className="MenuGroup">
          <li className="MenuItem language">
            <span>{t('menu.language')}</span>
            <Switch.Root
              className="Switch"
              onCheckedChange={handleCheckedChange}
              checked={checked}
            >
              <Switch.Thumb className="Thumb" />
              <span className="left">JP</span>
              <span className="right">EN</span>
            </Switch.Root>
          </li>
        </div>
        <div className="MenuGroup">
          <li className="MenuItem">
            <Link href="/teams">{t('menu.teams')}</Link>
          </li>

          <li className="MenuItem disabled">
            <div>
              <span>{t('menu.guides')}</span>
              <i className="tag">{t('coming_soon')}</i>
            </div>
          </li>
        </div>
        <div className="MenuGroup">
          <AboutModal />
          <ChangelogModal />
          <RoadmapModal />
        </div>
        <div className="MenuGroup">
          <LoginModal />
          <SignupModal />
        </div>
      </ul>
    )
  }

  return props.authenticated ? authItems() : unauthItems()
}

export default HeaderMenu
