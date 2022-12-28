import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { deleteCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import { accountState, initialAccountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'

import Button from '~components/Button'
import HeaderMenu from '~components/HeaderMenu'

import AddIcon from '~public/icons/Add.svg'
import LinkIcon from '~public/icons/Link.svg'
import MenuIcon from '~public/icons/Menu.svg'
import SaveIcon from '~public/icons/Save.svg'
import classNames from 'classnames'

import './index.scss'

const Header = () => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()

  // State management
  const [open, setOpen] = useState(false)

  // Snapshots
  const { account } = useSnapshot(accountState)
  const { party } = useSnapshot(appState)

  function menuButtonClicked() {
    setOpen(!open)
  }

  function onClickOutsideMenu() {
    setOpen(false)
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
    deleteCookie('account')
    deleteCookie('user')

    // Clean state
    const resetState = clonedeep(initialAccountState)
    Object.keys(resetState).forEach((key) => {
      if (key !== 'language') accountState[key] = resetState[key]
    })

    if (router.route != '/new') appState.party.editable = false

    router.push('/')
    return false
  }

  function toggleFavorite() {
    if (party.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (party.id)
      api.saveTeam({ id: party.id, params: headers }).then((response) => {
        if (response.status == 201) appState.party.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (party.id)
      api.unsaveTeam({ id: party.id, params: headers }).then((response) => {
        if (response.status == 200) appState.party.favorited = false
      })
    else console.error('Failed to unsave team: No party ID')
  }

  const copyButton = () => {
    if (router.route === '/p/[party]')
      return (
        <Button
          accessoryIcon={<LinkIcon className="stroke" />}
          blended={true}
          text={t('buttons.copy')}
          onClick={copyToClipboard}
        />
      )
  }

  const leftNav = () => {
    return (
      <div id="DropdownWrapper">
        <Button
          accessoryIcon={<MenuIcon />}
          className={classNames({ Active: open })}
          blended={true}
          text={t('buttons.menu')}
          onClick={menuButtonClicked}
        />
        <HeaderMenu
          authenticated={account.authorized}
          open={open}
          username={account.user?.username}
          onClickOutside={onClickOutsideMenu}
          logout={logout}
        />
      </div>
    )
  }

  const saveButton = () => {
    if (party.favorited)
      return (
        <Button
          accessoryIcon={<SaveIcon />}
          blended={true}
          text="Saved"
          onClick={toggleFavorite}
        />
      )
    else
      return (
        <Button
          accessoryIcon={<SaveIcon />}
          blended={true}
          text="Save"
          onClick={toggleFavorite}
        />
      )
  }

  const rightNav = () => {
    return (
      <div>
        {router.route === '/p/[party]' &&
        account.user &&
        (!party.user || party.user.id !== account.user.id)
          ? saveButton()
          : ''}

        {copyButton()}

        <Button
          accessoryIcon={<AddIcon className="Add" />}
          blended={true}
          text={t('buttons.new')}
          onClick={newParty}
        />
      </div>
    )
  }

  return (
    <nav id="Header">
      <div id="Left">{leftNav()}</div>
      <div id="Right">{rightNav()}</div>
    </nav>
  )
}

export default Header
