'use client'

// Libraries
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSnapshot } from 'valtio'
import { useTranslations } from 'next-intl'

// Dependencies: Common
import Button from '~components/common/Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '~components/common/DropdownMenuContent'
import DropdownMenuGroup from '~components/common/DropdownMenuGroup'
import DropdownMenuItem from '~components/common/DropdownMenuItem'

// Dependencies: Toasts
import RemixedToast from '~components/toasts/RemixedToast'
import UrlCopiedToast from '~components/toasts/UrlCopiedToast'

// Dependencies: Alerts
import DeleteTeamAlert from '~components/dialogs/DeleteTeamAlert'
import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'

// Dependencies: Utils
import { appState } from '~utils/appState'

// Dependencies: Icons
import EllipsisIcon from '~public/icons/Ellipsis.svg'

// Dependencies: Props
interface Props {
  editable: boolean
  deleteTeamCallback: () => void
  remixTeamCallback: () => void
  teamVisibilityCallback: () => void
}

const PartyDropdown = ({
  editable,
  deleteTeamCallback,
  remixTeamCallback,
  teamVisibilityCallback,
}: Props) => {
  // Localization
  const t = useTranslations('common')

  // Router
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)

  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)

  // Snapshots
  const { party: partySnapshot } = useSnapshot(appState)

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
    if (pathname.split('/')[1] === 'p') {
      navigator.clipboard.writeText(window.location.href)
      setCopyToastOpen(true)
    }
  }

  // Methods: Event handlers

  // Dialogs / Visibility
  function visibilityCallback() {
    teamVisibilityCallback()
  }

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

  const items = (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={visibilityCallback}>
          <span>{t('dropdown.party.visibility')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <span>{t('dropdown.party.copy')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openRemixTeamAlert}>
          <span>{t('dropdown.party.remix')}</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuGroup>
        <DropdownMenuItem destructive={true} onClick={openDeleteTeamAlert}>
          <span>{t('dropdown.party.delete')}</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )

  return (
    <>
      <div className="dropdownWrapper">
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              active={open}
              blended={true}
              leftAccessoryIcon={<EllipsisIcon />}
              onClick={handleButtonClicked}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>{items}</DropdownMenuContent>
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
