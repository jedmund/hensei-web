import React, { useEffect, useState } from 'react'
import { subscribe, useSnapshot } from 'valtio'
import { setCookie, deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'
import Link from 'next/link'

import api from '~utils/api'
import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { getLocalId } from '~utils/localId'
import { retrieveLocaleCookies } from '~utils/retrieveCookies'
import { setEditKey, storeEditKey } from '~utils/userToken'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '~components/common/DropdownMenuContent'
import LoginModal from '~components/auth/LoginModal'
import SignupModal from '~components/auth/SignupModal'
import AccountModal from '~components/auth/AccountModal'
import Toast from '~components/common/Toast'
import Button from '~components/common/Button'
import Tooltip from '~components/common/Tooltip'
import * as Switch from '@radix-ui/react-switch'

import ArrowIcon from '~public/icons/Arrow.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import RemixIcon from '~public/icons/Remix.svg'
import PlusIcon from '~public/icons/Add.svg'
import SaveIcon from '~public/icons/Save.svg'

import './index.scss'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const localeData = retrieveLocaleCookies()

  // State management
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)
  const [languageChecked, setLanguageChecked] = useState(false)

  const [name, setName] = useState('')
  const [originalName, setOriginalName] = useState('')

  // Snapshots
  const { account } = useSnapshot(accountState)
  const { party: partySnapshot } = useSnapshot(appState)

  // Subscribe to app state to listen for party name and
  // unsubscribe when component is unmounted
  const unsubscribe = subscribe(appState, () => {
    const newName =
      appState.party && appState.party.name ? appState.party.name : ''
    setName(newName)
  })

  useEffect(() => () => unsubscribe(), [])

  // Hooks
  useEffect(() => {
    setLanguageChecked(localeData === 'ja' ? true : false)
  }, [localeData])

  // Methods: Event handlers (Buttons)
  function handleLeftMenuButtonClicked() {
    setLeftMenuOpen(!leftMenuOpen)
  }

  function handleRightMenuButtonClicked() {
    setRightMenuOpen(!rightMenuOpen)
  }

  // Methods: Event handlers (Menus)
  function handleLeftMenuOpenChange(open: boolean) {
    setLeftMenuOpen(open)
  }

  function handleRightMenuOpenChange(open: boolean) {
    setRightMenuOpen(open)
  }

  function closeLeftMenu() {
    setLeftMenuOpen(false)
  }

  function closeRightMenu() {
    setRightMenuOpen(false)
  }

  // Methods: Event handlers (Copy toast)
  function handleCopyToastOpenChanged(open: boolean) {
    setCopyToastOpen(open)
  }

  function handleCopyToastCloseClicked() {
    setCopyToastOpen(false)
  }

  // Methods: Event handlers (Remix toasts)
  function handleRemixToastOpenChanged(open: boolean) {
    setRemixToastOpen(open)
  }

  function handleRemixToastCloseClicked() {
    setRemixToastOpen(false)
  }

  // Methods: Actions
  function handleNewTeam(event: React.MouseEvent) {
    event.preventDefault()
    newTeam()
    closeRightMenu()
  }

  function changeLanguage(value: boolean) {
    const language = value ? 'ja' : 'en'
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 120)

    setCookie('NEXT_LOCALE', language, { path: '/', expires: expiresAt })
    router.push(router.asPath, undefined, { locale: language })
  }

  function copyToClipboard() {
    const path = router.asPath.split('/')[1]

    if (path === 'p') {
      const el = document.createElement('input')
      el.value = window.location.href
      el.id = 'url-input'
      document.body.appendChild(el)

      el.select()
      document.execCommand('copy')
      el.remove()

      setCopyToastOpen(true)
    }
  }

  function logout() {
    // Close menu
    closeRightMenu()

    // Delete cookies
    deleteCookie('account')
    deleteCookie('user')

    // Clean state
    const resetState = clonedeep(initialAccountState)
    Object.keys(resetState).forEach((key) => {
      if (key !== 'language') accountState[key] = resetState[key]
    })

    router.reload()
    return false
  }

  function newTeam() {
    // Clean state
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })

    // Push the root URL
    router.push('/new')
  }

  function remixTeam() {
    setOriginalName(partySnapshot.name ? partySnapshot.name : t('no_title'))

    if (partySnapshot.shortcode) {
      const body = getLocalId()
      api
        .remix({ shortcode: partySnapshot.shortcode, body: body })
        .then((response) => {
          const remix = response.data.party

          // Store the edit key in local storage
          if (remix.edit_key) {
            storeEditKey(remix.id, remix.edit_key)
            setEditKey(remix.id, remix.user)
          }

          router.push(`/p/${remix.shortcode}`)
          setRemixToastOpen(true)
        })
    }
  }

  function toggleFavorite() {
    if (partySnapshot.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (partySnapshot.id)
      api.saveTeam({ id: partySnapshot.id }).then((response) => {
        if (response.status == 201) appState.party.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (partySnapshot.id)
      api.unsaveTeam({ id: partySnapshot.id }).then((response) => {
        if (response.status == 200) appState.party.favorited = false
      })
    else console.error('Failed to unsave team: No party ID')
  }

  // Rendering: Elements
  const pageTitle = () => {
    let title = ''
    let hasAccessory = false

    const path = router.asPath.split('/')[1]
    if (path === 'p') {
      hasAccessory = true
      if (appState.party && appState.party.name) {
        title = appState.party.name
      } else {
        title = t('no_title')
      }
    } else {
      title = ''
    }

    return title !== '' ? (
      <Tooltip content={t('tooltips.copy_url')}>
        <Button
          blended={true}
          rightAccessoryIcon={
            path === 'p' && hasAccessory ? (
              <LinkIcon className="stroke" />
            ) : undefined
          }
          text={title}
          onClick={copyToClipboard}
        />
      </Tooltip>
    ) : (
      ''
    )
  }

  const profileImage = () => {
    let image

    const user = accountState.account.user
    if (accountState.account.authorized && user) {
      image = (
        <img
          alt={user.username}
          className={`profile ${user.avatar.element}`}
          srcSet={`/profile/${user.avatar.picture}.png, 
                      /profile/${user.avatar.picture}@2x.png 2x`}
          src={`/profile/${user.avatar.picture}.png`}
        />
      )
    } else {
      image = (
        <img
          alt={t('no_user')}
          className={`profile anonymous`}
          srcSet={`/profile/npc.png, 
                      /profile/npc@2x.png 2x`}
          src={`/profile/npc.png`}
        />
      )
    }

    return image
  }

  // Rendering: Buttons
  const newButton = () => {
    return (
      <Tooltip content={t('tooltips.new')}>
        <Button
          leftAccessoryIcon={<PlusIcon />}
          className="New"
          blended={true}
          text={t('buttons.new')}
          onClick={newTeam}
        />
      </Tooltip>
    )
  }

  // Rendering: Toasts
  const urlCopyToast = () => {
    return (
      <Toast
        altText={t('toasts.copied')}
        open={copyToastOpen}
        duration={2400}
        type="foreground"
        content={t('toasts.copied')}
        onOpenChange={handleCopyToastOpenChanged}
        onCloseClick={handleCopyToastCloseClicked}
      />
    )
  }

  const remixToast = () => {
    return (
      <Toast
        altText={t('toasts.remixed', { title: originalName })}
        open={remixToastOpen}
        duration={2400}
        type="foreground"
        content={
          <Trans i18nKey="toasts.remixed">
            You remixed <strong>{{ title: originalName }}</strong>
          </Trans>
        }
        onOpenChange={handleRemixToastOpenChanged}
        onCloseClick={handleRemixToastCloseClicked}
      />
    )
  }

  // Rendering: Modals
  const settingsModal = () => {
    const user = accountState.account.user

    if (user) {
      return (
        <AccountModal
          open={settingsModalOpen}
          username={user.username}
          picture={user.avatar.picture}
          gender={user.gender}
          language={user.language}
          theme={user.theme}
          onOpenChange={setSettingsModalOpen}
        />
      )
    }
  }

  const loginModal = () => {
    return <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
  }

  const signupModal = () => {
    return (
      <SignupModal open={signupModalOpen} onOpenChange={setSignupModalOpen} />
    )
  }

  // Rendering: Compositing
  const left = () => {
    return (
      <section>
        <div id="DropdownWrapper">
          <DropdownMenu
            open={leftMenuOpen}
            onOpenChange={handleLeftMenuOpenChange}
          >
            <DropdownMenuTrigger asChild>
              <Button
                leftAccessoryIcon={<MenuIcon />}
                className={classNames({ Active: leftMenuOpen })}
                blended={true}
                onClick={handleLeftMenuButtonClicked}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="Left">
              {leftMenuItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!appState.errorCode ? pageTitle() : ''}
      </section>
    )
  }

  const right = () => {
    return (
      <section>
        {newButton()}
        <DropdownMenu
          open={rightMenuOpen}
          onOpenChange={handleRightMenuOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <Button
              className={classNames({ Active: rightMenuOpen })}
              leftAccessoryIcon={profileImage()}
              rightAccessoryIcon={<ArrowIcon />}
              rightAccessoryClassName="Arrow"
              onClick={handleRightMenuButtonClicked}
              blended={true}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="Right">
            {rightMenuItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    )
  }

  const leftMenuItems = () => {
    return (
      <>
        {accountState.account.authorized && accountState.account.user ? (
          <>
            <DropdownMenuGroup className="MenuGroup">
              <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
                <Link
                  href={`/${accountState.account.user.username}` || ''}
                  passHref
                >
                  <span>{t('menu.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
                <Link href={`/saved` || ''}>{t('menu.saved')}</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : (
          ''
        )}
        <DropdownMenuGroup className="MenuGroup">
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <Link href="/teams">{t('menu.teams')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem">
            <div>
              <span>{t('menu.guides')}</span>
              <i className="tag">{t('coming_soon')}</i>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup className="MenuGroup">
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <a
              href={locale == 'ja' ? '/ja/about' : '/about'}
              target="_blank"
              rel="noreferrer"
            >
              {t('about.segmented_control.about')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <a
              href={locale == 'ja' ? '/ja/updates' : '/updates'}
              target="_blank"
              rel="noreferrer"
            >
              {t('about.segmented_control.updates')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <a
              href={locale == 'ja' ? '/ja/roadmap' : '/roadmap'}
              target="_blank"
              rel="noreferrer"
            >
              {t('about.segmented_control.roadmap')}
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </>
    )
  }

  const rightMenuItems = () => {
    let items

    const account = accountState.account
    if (account.authorized && account.user) {
      items = (
        <>
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuLabel className="MenuLabel">
              {account.user ? `@${account.user.username}` : t('no_user')}
            </DropdownMenuLabel>
            <DropdownMenuItem className="MenuItem" onClick={closeRightMenu}>
              <Link href={`/${account.user.username}` || ''} passHref>
                <span>{t('menu.profile')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setSettingsModalOpen(true)}
            >
              <span>{t('menu.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="MenuItem" onClick={logout}>
              <span>{t('menu.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )
    } else {
      items = (
        <>
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuItem className="MenuItem language">
              <span>{t('menu.language')}</span>
              <Switch.Root
                className="Switch"
                onCheckedChange={changeLanguage}
                checked={languageChecked}
              >
                <Switch.Thumb className="Thumb" />
                <span className="left">JP</span>
                <span className="right">EN</span>
              </Switch.Root>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setLoginModalOpen(true)}
            >
              <span>{t('menu.login')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setSignupModalOpen(true)}
            >
              <span>{t('menu.signup')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )
    }

    return items
  }

  return (
    <nav id="Header">
      {left()}
      {right()}
      {urlCopyToast()}
      {remixToast()}
      {settingsModal()}
      {loginModal()}
      {signupModal()}
    </nav>
  )
}

export default Header
