// Libraries
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { subscribe, useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

// Dependencies: Common
import Button from '~components/common/Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '~components/common/DropdownMenuContent'

// Dependencies: Toasts
import RemixedToast from '~components/toasts/RemixedToast'
import UrlCopiedToast from '~components/toasts/UrlCopiedToast'

// Dependencies: Alerts
import DeleteTeamAlert from '~components/dialogs/DeleteTeamAlert'
import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'

// Dependencies: Utils
import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState } from '~utils/appState'
import { getLocalId } from '~utils/localId'
import { retrieveLocaleCookies } from '~utils/retrieveCookies'
import { setEditKey, storeEditKey } from '~utils/userToken'

// Dependencies: Icons
import EllipsisIcon from '~public/icons/Ellipsis.svg'

// Dependencies: Props
interface Props {
  editable: boolean
  deleteTeamCallback: () => void
  remixTeamCallback: () => void
}

const PartyDropdown = ({
  editable,
  deleteTeamCallback,
  remixTeamCallback,
}: Props) => {
  // Localization
  const { t } = useTranslation('common')

  // Router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const localeData = retrieveLocaleCookies()

  const [open, setOpen] = useState(false)

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)

  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)

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

  // Methods: Event handlers (Buttons)
  function handleButtonClicked() {
    setOpen(!open)
  }

  // Methods: Event handlers (Menus)
  function handleOpenChange(open: boolean) {
    setOpen(open)
  }

  function closeMenu() {
    setOpen(false)
  }

  // Method: Actions
  function copyToClipboard() {
    if (router.asPath.split('/')[1] === 'p') {
      navigator.clipboard.writeText(window.location.href)
      setCopyToastOpen(true)
    }
  }

  // Methods: Event handlers

  // Alerts / Delete team
  function openDeleteTeamAlert() {
    setDeleteAlertOpen(true)
  }

  function handleDeleteTeamAlertChange(open: boolean) {
    setDeleteAlertOpen(open)
  }

  // Alerts / Remix team
  function openRemixTeamAlert() {
    setRemixAlertOpen(true)
  }

  function handleRemixTeamAlertChange(open: boolean) {
    setRemixAlertOpen(open)
  }

  // Toasts / Copy URL
  function handleCopyToastOpenChanged(open: boolean) {
    setCopyToastOpen(!open)
  }

  function handleCopyToastCloseClicked() {
    setCopyToastOpen(false)
  }

  // Toasts: Remix team
  function handleRemixToastOpenChanged(open: boolean) {
    setRemixToastOpen(!open)
  }

  function handleRemixToastCloseClicked() {
    setRemixToastOpen(false)
  }

  function remixCallback() {
    setRemixToastOpen(true)
    remixTeamCallback()
  }

  const editableItems = () => {
    return (
      <>
        <DropdownMenuGroup className="MenuGroup">
          <DropdownMenuItem className="MenuItem" onClick={copyToClipboard}>
            <span>Copy link to team</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="MenuItem" onClick={openRemixTeamAlert}>
            <span>Remix team</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup className="MenuGroup">
          <DropdownMenuItem className="MenuItem" onClick={openDeleteTeamAlert}>
            <span className="destructive">Delete team</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </>
    )
  }

  return (
    <>
      <div id="DropdownWrapper">
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              leftAccessoryIcon={<EllipsisIcon />}
              className={classNames({ Active: open })}
              blended={true}
              onClick={handleButtonClicked}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>{editableItems()}</DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteTeamAlert
        open={deleteAlertOpen}
        onOpenChange={handleDeleteTeamAlertChange}
        deleteCallback={deleteTeamCallback}
      />

      <RemixTeamAlert
        creator={editable}
        name={partySnapshot.name || t('no_title')}
        open={remixAlertOpen}
        onOpenChange={handleRemixTeamAlertChange}
        remixCallback={remixCallback}
      />

      <RemixedToast
        open={remixToastOpen}
        partyName={partySnapshot.name || t('no_title')}
        onOpenChange={handleRemixToastOpenChanged}
        onCloseClick={handleRemixToastCloseClicked}
      />

      <UrlCopiedToast
        open={copyToastOpen}
        onOpenChange={handleCopyToastOpenChanged}
        onCloseClick={handleCopyToastCloseClicked}
      />
    </>
  )
}

export default PartyDropdown
