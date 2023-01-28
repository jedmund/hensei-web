import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import capitalizeFirstLetter from '~utils/capitalizeFirstLetter'

import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

import AddIcon from '~public/icons/Add.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import ArrowIcon from '~public/icons/Arrow.svg'
import SaveIcon from '~public/icons/Save.svg'

import './index.scss'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~components/DropdownMenuContent'
import Link from 'next/link'
import LoginModal from '~components/LoginModal'
import SignupModal from '~components/SignupModal'
import AccountModal from '~components/AccountModal'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()

  // State management
  const [open, setOpen] = useState(false)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)

  // Snapshots
  const { account } = useSnapshot(accountState)
  const { party } = useSnapshot(appState)

  function handleLeftMenuButtonClicked() {
    setLeftMenuOpen(!leftMenuOpen)
  }

  function handleRightMenuButtonClicked() {
    setRightMenuOpen(!rightMenuOpen)
  }

  function onClickOutsideMenu() {
    setOpen(false)
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

  function copyToClipboard() {
    const el = document.createElement('input')
    el.value = window.location.href
    el.id = 'url-input'
    document.body.appendChild(el)

    el.select()
    document.execCommand('copy')
    el.remove()
  }

  function newParty() {
    // Push the root URL
    router.push('/')

    // Clean state
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })

    // Set party to be editable
    appState.party.editable = true
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

  const title = () => {
    let title = ''
    let hasAccessory = false

    const path = router.asPath.split('/')[1]
    console.log(router.asPath.split('/'))
    if (path === 'p') {
      hasAccessory = true
      if (appState.party && appState.party.name) {
        title = appState.party.name
      } else {
        title = t('no_title')
      }
    } else if (['weapons', 'summons', 'characters', 'new', ''].includes(path)) {
      title = t('new_party')
    } else if (
      ['about', 'updates', 'roadmap', 'saved', 'teams'].includes(path)
    ) {
      title = capitalizeFirstLetter(path)
    } else {
      title = path
    }

    return (
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
    )
  }

  const saveButton = () => {
    if (party.favorited)
      return (
        <Button
          leftAccessoryIcon={<SaveIcon />}
          blended={true}
          text="Saved"
          onClick={toggleFavorite}
        />
      )
    else
      return (
        <Button
          leftAccessoryIcon={<SaveIcon />}
          blended={true}
          text="Save"
          onClick={toggleFavorite}
        />
      )
  }

  const image = () => {
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
        {title()}
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

        {/* <Button
          leftAccessoryIcon={<AddIcon className="Add" />}
          blended={true}
          text={t('buttons.new')}
          onClick={newParty}
        /> */}

        <DropdownMenu
          open={rightMenuOpen}
          onOpenChange={handleRightMenuOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <Button
              className={classNames({ Active: rightMenuOpen })}
              leftAccessoryIcon={image()}
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
            <DropdownMenuItem className="MenuItem" onClick={closeRightMenu}>
              <Link href={`/new` || ''} passHref>
                New party
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="MenuItem" onClick={closeRightMenu}>
              <Link href={`/${account.user.username}` || ''} passHref>
                Your profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="MenuGroup">
            <DropdownMenuItem
              className="MenuItem"
              onClick={closeRightMenu}
              asChild
            >
              <AccountModal
                username={account.user.username}
                picture={account.user.picture}
                gender={account.user.gender}
                language={account.user.language}
                theme={account.user.theme}
              />
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
              <Link href={`/new` || ''} passHref>
                New party
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="MenuGroup">
            <LoginModal />
            <SignupModal />
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
    </nav>
  )
}

export default Header
