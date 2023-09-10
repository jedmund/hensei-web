import React, { useState } from 'react'
import { deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'
import Link from 'next/link'

import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import Alert from '~components/common/Alert'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '~components/common/DropdownMenuContent'
import DropdownMenuGroup from '~components/common/DropdownMenuGroup'
import DropdownMenuLabel from '~components/common/DropdownMenuLabel'
import DropdownMenuItem from '~components/common/DropdownMenuItem'
import LanguageSwitch from '~components/LanguageSwitch'
import LoginModal from '~components/auth/LoginModal'
import SignupModal from '~components/auth/SignupModal'
import AccountModal from '~components/auth/AccountModal'
import Button from '~components/common/Button'
import Tooltip from '~components/common/Tooltip'

import BahamutIcon from '~public/icons/Bahamut.svg'
import ChevronIcon from '~public/icons/Chevron.svg'
import MenuIcon from '~public/icons/Menu.svg'
import PlusIcon from '~public/icons/Add.svg'

import styles from './index.module.scss'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // State management
  const [alertOpen, setAlertOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)

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

  // Methods: Actions
  function handleNewTeam(event: React.MouseEvent) {
    event.preventDefault()
    newTeam()
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

  function newTeam() {
    // Clean state
    const resetState = clonedeep(initialAppState)
    Object.keys(resetState).forEach((key) => {
      appState[key] = resetState[key]
    })

    // Push the root URL
    router.push('/new', undefined, { shallow: true })
  }

  // Methods: Rendering
  const profileImage = () => {
    const user = accountState.account.user
    if (accountState.account.authorized && user) {
      return (
        <img
          alt={user.username}
          className={`profile ${user.avatar.element}`}
          srcSet={`/profile/${user.avatar.picture}.png, 
                      /profile/${user.avatar.picture}@2x.png 2x`}
          src={`/profile/${user.avatar.picture}.png`}
        />
      )
    } else {
      return (
        <img
          alt={t('no_user')}
          className={`profile anonymous`}
          srcSet={`/profile/npc.png, 
                      /profile/npc@2x.png 2x`}
          src={`/profile/npc.png`}
        />
      )
    }
  }

  // Rendering: Buttons
  const newButton = (
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

  // Rendering: Modals
  const logoutConfirmationAlert = (
    <Alert
      message={t('alert.confirm_logout')}
      open={alertOpen}
      primaryActionText="Log out"
      primaryAction={logout}
      cancelActionText="Nevermind"
      cancelAction={() => setAlertOpen(false)}
    />
  )

  const settingsModal = (
    <>
      {accountState.account.user && (
        <AccountModal
          open={settingsModalOpen}
          username={accountState.account.user.username}
          picture={accountState.account.user.avatar.picture}
          gender={accountState.account.user.gender}
          language={accountState.account.user.language}
          theme={accountState.account.user.theme}
          role={accountState.account.user.role}
          bahamutMode={
            accountState.account.user.role === 9
              ? accountState.account.user.bahamut
              : false
          }
          onOpenChange={setSettingsModalOpen}
        />
      )}
    </>
  )

  const loginModal = (
    <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
  )

  const signupModal = (
    <SignupModal open={signupModalOpen} onOpenChange={setSignupModalOpen} />
  )

  // Rendering: Compositing
  const authorizedLeftItems = (
    <>
      {accountState.account.user && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={closeLeftMenu}>
              <Link
                href={`/${accountState.account.user.username}` || ''}
                passHref
              >
                <span>{t('menu.profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={closeLeftMenu}>
              <Link href={`/saved` || ''}>{t('menu.saved')}</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )}
    </>
  )
  const leftMenuItems = (
    <>
      {accountState.account.authorized &&
        accountState.account.user &&
        authorizedLeftItems}

      <DropdownMenuGroup>
        <DropdownMenuItem onClick={closeLeftMenu}>
          <Link href="/teams">{t('menu.teams')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div>
            <span>{t('menu.guides')}</span>
            <i className="tag">{t('coming_soon')}</i>
          </div>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={closeLeftMenu}>
          <a
            href={locale == 'ja' ? '/ja/about' : '/about'}
            target="_blank"
            rel="noreferrer"
          >
            {t('about.segmented_control.about')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={closeLeftMenu}>
          <a
            href={locale == 'ja' ? '/ja/updates' : '/updates'}
            target="_blank"
            rel="noreferrer"
          >
            {t('about.segmented_control.updates')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={closeLeftMenu}>
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

  const left = (
    <section>
      <div className={styles.dropdownWrapper}>
        <DropdownMenu
          open={leftMenuOpen}
          onOpenChange={handleLeftMenuOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <Button
              active={leftMenuOpen}
              blended={true}
              leftAccessoryIcon={<MenuIcon />}
              onClick={handleLeftMenuButtonClicked}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="Left">
            {leftMenuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  )

  const authorizedRightItems = (
    <>
      {accountState.account.user && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {`@${accountState.account.user.username}`}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={closeRightMenu}>
              <Link
                href={`/${accountState.account.user.username}` || ''}
                passHref
              >
                <span>{t('menu.profile')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="MenuItem"
              onClick={() => setSettingsModalOpen(true)}
            >
              <span>{t('menu.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAlertOpen(true)}
              destructive={true}
            >
              <span>{t('menu.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )}
    </>
  )

  const unauthorizedRightItems = (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem className="language">
          <span>{t('menu.language')}</span>
          <LanguageSwitch />
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

  const rightMenuItems = (
    <>
      {accountState.account.authorized && accountState.account.user
        ? authorizedRightItems
        : unauthorizedRightItems}
    </>
  )

  const right = (
    <section>
      {newButton}
      <DropdownMenu
        open={rightMenuOpen}
        onOpenChange={handleRightMenuOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <Button
            className={classNames({ Active: rightMenuOpen })}
            leftAccessoryIcon={profileImage()}
            rightAccessoryIcon={<ChevronIcon />}
            rightAccessoryClassName="Arrow"
            onClick={handleRightMenuButtonClicked}
            blended={true}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="Right">
          {rightMenuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  )

  return (
    <>
      {accountState.account.user?.bahamut && (
        <div className={styles.bahamut}>
          <BahamutIcon />
          <p>Bahamut Mode is active</p>
        </div>
      )}
      <nav className={styles.header}>
        {left}
        {right}
        {logoutConfirmationAlert}
        {settingsModal}
        {loginModal}
        {signupModal}
      </nav>
    </>
  )
}

export default Header
