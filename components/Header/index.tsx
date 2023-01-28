import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'
import Link from 'next/link'

import api from '~utils/api'
import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import capitalizeFirstLetter from '~utils/capitalizeFirstLetter'

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

import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import ArrowIcon from '~public/icons/Arrow.svg'
import SaveIcon from '~public/icons/Save.svg'

import './index.scss'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()

  // State management
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)

  // Snapshots
  const { account } = useSnapshot(accountState)
  const { party } = useSnapshot(appState)

  function handleCopyToastOpenChanged(open: boolean) {
    setCopyToastOpen(open)
  }

  function handleCopyToastCloseClicked() {
    setCopyToastOpen(false)
  }

  function handleLeftMenuButtonClicked() {
    setLeftMenuOpen(!leftMenuOpen)
  }

  function handleRightMenuButtonClicked() {
    setRightMenuOpen(!rightMenuOpen)
  }

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

  function handleSettingsOpenChanged(open: boolean) {
    setRightMenuOpen(false)
  }

  function copyToClipboard() {
    const el = document.createElement('input')
    el.value = window.location.href
    el.id = 'url-input'
    document.body.appendChild(el)

    el.select()
    document.execCommand('copy')
    el.remove()

    setCopyToastOpen(true)
  }

  function handleNewParty(event: React.MouseEvent, path: string) {
    event.preventDefault()

    // Push the root URL
    router.push(path)

    // Clean state
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })

    // Set party to be editable
    appState.party.editable = true

    // Close right menu
    closeRightMenu()
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

  function toggleFavorite() {
    if (party.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (party.id)
      api.saveTeam({ id: party.id }).then((response) => {
        if (response.status == 201) appState.party.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (party.id)
      api.unsaveTeam({ id: party.id }).then((response) => {
        if (response.status == 200) appState.party.favorited = false
      })
    else console.error('Failed to unsave team: No party ID')
  }

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
          className={`profile ${user.element}`}
          srcSet={`/profile/${user.picture}.png, 
                      /profile/${user.picture}@2x.png 2x`}
          src={`/profile/${user.picture}.png`}
        />
      )
    } else {
      image = <div className="profile placeholder" />
    }

    return image
  }

  const urlCopyToast = () => {
    return (
      <Toast
        open={copyToastOpen}
        duration={2400}
        type="foreground"
        content="This party's URL was copied to your clipboard"
        onOpenChange={handleCopyToastOpenChanged}
        onCloseClick={handleCopyToastCloseClicked}
      />
    )
  }

  const saveButton = () => {
    return (
      <Button
        leftAccessoryIcon={<SaveIcon />}
        className={classNames({
          Save: true,
          Saved: party.favorited,
        })}
        blended={true}
        text={party.favorited ? 'Saved' : 'Save'}
        onClick={toggleFavorite}
      />
    )
  }

  const settingsModal = () => {
    const user = accountState.account.user

    if (user) {
      return (
        <AccountModal
          open={settingsModalOpen}
          username={user.username}
          picture={user.picture}
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
        {pageTitle()}
      </section>
    )
  }

  const right = () => {
    return (
      <section>
        {router.route === '/p/[party]' &&
        account.user &&
        (!party.user || party.user.id !== account.user.id)
          ? saveButton()
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
      {settingsModal()}
      {loginModal()}
      {signupModal()}
    </nav>
  )
}

export default Header
