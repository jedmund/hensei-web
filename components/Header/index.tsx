import React, { useEffect, useState } from 'react'
import { subscribe, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'
import Link from 'next/link'

import api from '~utils/api'
import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~components/DropdownMenuContent'
import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'
import AccountModal from '~components/AccountModal'
import Toast from '~components/Toast'
import Button from '~components/Button'

import ArrowIcon from '~public/icons/Arrow.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import RemixIcon from '~public/icons/Remix.svg'
import SaveIcon from '~public/icons/Save.svg'

import './index.scss'
import Tooltip from '~components/Tooltip'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()

  // State management
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)

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

  // Subscribe to router changes
  useEffect(() => {
    router.events.on('routeChangeStart', (url, { shallow }) => {
      console.log(`routing to ${url}`, `is shallow routing: ${shallow}`)
    })
  }, [])

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
  function handleNewParty(event: React.MouseEvent, path: string) {
    event.preventDefault()

    // Clean state
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })

    // Push the root URL
    router.push(path)

    // Close right menu
    closeRightMenu()
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

  function remixTeam() {
    setOriginalName(partySnapshot.name ? partySnapshot.name : t('no_title'))

    if (partySnapshot.shortcode)
      api.remix(partySnapshot.shortcode).then((response) => {
        const remix = response.data.party
        router.push(`/p/${remix.shortcode}`)
        setRemixToastOpen(true)
      })
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
    } else if (['weapons', 'summons', 'characters', 'new', ''].includes(path)) {
      title = t('new_party')
    } else {
      title = ''
    }

    return title !== '' ? (
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
      image = <div className="profile placeholder" />
    }

    return image
  }

  // Rendering: Buttons
  const saveButton = () => {
    return (
      <Tooltip content={t('tooltips.save')}>
        <Button
          leftAccessoryIcon={<SaveIcon />}
          className={classNames({
            Save: true,
            Saved: partySnapshot.favorited,
          })}
          blended={true}
          text={
            partySnapshot.favorited ? t('buttons.saved') : t('buttons.save')
          }
          onClick={toggleFavorite}
        />
      </Tooltip>
    )
  }

  const remixButton = () => {
    return (
      <Tooltip content={t('tooltips.remix')}>
        <Button
          leftAccessoryIcon={<RemixIcon />}
          className="Remix"
          blended={true}
          text={t('buttons.remix')}
          onClick={remixTeam}
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
        {router.route === '/p/[party]' &&
        account.user &&
        (!partySnapshot.user || partySnapshot.user.id !== account.user.id) &&
        !appState.errorCode
          ? saveButton()
          : ''}
        {router.route === '/p/[party]' && !appState.errorCode
          ? remixButton()
          : ''}
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
              <DropdownMenuItem className="MenuItem" onClick={closeRightMenu}>
                <Link
                  href={`/${accountState.account.user.username}` || ''}
                  passHref
                >
                  Your profile
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
            <a href="/about" target="_blank">
              {t('about.segmented_control.about')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <a href="/updates" target="_blank">
              {t('about.segmented_control.updates')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem" onClick={closeLeftMenu}>
            <a href="/roadmap" target="_blank">
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
            <DropdownMenuItem className="MenuItem">
              <Link href="/new">
                <a onClick={(e: React.MouseEvent) => handleNewParty(e, '/new')}>
                  New party
                </a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="MenuItem">
              <Link href={`/${account.user.username}` || ''} passHref>
                Your profile
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
            <DropdownMenuItem className="MenuItem">
              <Link href="/new">
                <a onClick={(e: React.MouseEvent) => handleNewParty(e, '/new')}>
                  New party
                </a>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setLoginModalOpen(true)}
            >
              <span>Log in</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setSignupModalOpen(true)}
            >
              <span>Sign up</span>
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
