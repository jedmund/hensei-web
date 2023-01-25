import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { setCookie } from 'cookies-next'
import classNames from 'classnames'
import { retrieveCookies, retrieveLocaleCookies } from '~utils/retrieveCookies'

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
  const localeData = retrieveLocaleCookies()
  const { t } = useTranslation('common')

  // Refs
  const ref: React.RefObject<HTMLDivElement> = React.createRef()

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null
      const isButton = target && target.closest('.Button.Active')

      if (
        ref.current &&
        target &&
        !ref.current.contains(target) &&
        !isButton &&
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
    setChecked(localeData === 'ja' ? true : false)
  }, [localeData])

  function handleCheckedChange(value: boolean) {
    const language = value ? 'ja' : 'en'

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    setCookie('NEXT_LOCALE', language, { path: '/', expires: expiresAt })
    router.push(router.asPath, undefined, { locale: language })
  }

  const menuClasses = classNames({
    Menu: true,
    auth: props.authenticated,
    open: props.open,
  })

  function authItems() {
    return (
      <ul className={menuClasses}>
        <div className="MenuGroup">
          <li className="MenuItem profile">
            <Link href={`/${data?.account.username}` || ''} passHref>
              <div>
                <span>{data?.account.username}</span>
                <img
                  alt={data?.user.picture}
                  className={`profile ${data?.user.element}`}
                  srcSet={`/profile/${data?.user.picture}.png, 
                      /profile/${data?.user.picture}@2x.png 2x`}
                  src={`/profile/${data?.user.picture}.png`}
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
            username={data?.account.username}
            picture={data?.user.picture}
            gender={data?.user.gender}
            language={data?.user.language}
            theme={data?.user.theme}
          />
          <li className="MenuItem" onClick={props.logout}>
            <span>{t('menu.logout')}</span>
          </li>
        </div>
      </ul>
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

  return (
    <nav ref={ref}>{props.authenticated ? authItems() : unauthItems()}</nav>
  )
}

export default HeaderMenu
