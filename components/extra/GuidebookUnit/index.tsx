import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Alert from '~components/common/Alert'
import SearchModal from '~components/search/SearchModal'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/common/ContextMenu'
import ContextMenuItem from '~components/common/ContextMenuItem'
import Button from '~components/common/Button'

import type { SearchableObject } from '~types'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import './index.scss'

interface Props {
  guidebook: Guidebook | undefined
  position: number
  editable: boolean
  removeGuidebook: (position: number) => void
  updateObject: (object: SearchableObject, position: number) => void
}

const GuidebookUnit = ({
  guidebook,
  position,
  editable,
  removeGuidebook: sendGuidebookToRemove,
  updateObject,
}: Props) => {
  // Translations and locale
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // State: UI
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  // State: Other
  const [imageUrl, setImageUrl] = useState('')

  // Classes
  const classes = classNames({
    GuidebookUnit: true,
    editable: editable,
    filled: guidebook !== undefined,
    empty: guidebook == undefined,
  })

  const buttonClasses = classNames({
    Options: true,
    Clicked: contextMenuOpen,
  })

  // Hooks
  useEffect(() => {
    generateImageUrl()
  }, [guidebook])

  // Methods: Open layer
  function openSearchModal() {
    if (editable) setSearchModalOpen(true)
  }

  function openRemoveGuidebookAlert() {
    setAlertOpen(true)
  }

  // Methods: Handle button clicked
  function handleButtonClicked() {
    setContextMenuOpen(!contextMenuOpen)
  }

  // Methods: Handle open change
  function handleContextMenuOpenChange(open: boolean) {
    if (!open) setContextMenuOpen(false)
  }

  function handleSearchModalOpenChange(open: boolean) {
    setSearchModalOpen(open)
  }

  // Methods: Mutate data
  function removeGuidebook() {
    if (guidebook) sendGuidebookToRemove(position)
    setAlertOpen(false)
  }

  // Methods: Image string generation
  function generateImageUrl() {
    let imgSrc = guidebook
      ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/guidebooks/book_${guidebook.granblue_id}.png`
      : ''

    setImageUrl(imgSrc)
  }

  const placeholderImageUrl = '/images/placeholders/placeholder-guidebook.png'

  // Methods: Layer element rendering
  const contextMenu = () => {
    if (editable && guidebook) {
      return (
        <>
          <ContextMenu onOpenChange={handleContextMenuOpenChange}>
            <ContextMenuTrigger asChild>
              <Button
                leftAccessoryIcon={<SettingsIcon />}
                className={buttonClasses}
                onClick={handleButtonClicked}
              />
            </ContextMenuTrigger>
            <ContextMenuContent align="start">
              <ContextMenuItem onSelect={openRemoveGuidebookAlert}>
                {t('context.remove')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {removeAlert()}
        </>
      )
    }
  }

  const removeAlert = () => {
    return (
      <Alert
        open={alertOpen}
        primaryAction={removeGuidebook}
        primaryActionText={t('modals.guidebooks.buttons.remove')}
        cancelAction={() => setAlertOpen(false)}
        cancelActionText={t('buttons.cancel')}
        message={
          <Trans i18nKey="modals.guidebooks.messages.remove">
            Are you sure you want to remove{' '}
            <strong>{{ guidebook: guidebook?.name[locale] }}</strong> from your
            team?
          </Trans>
        }
      />
    )
  }

  const searchModal = () => {
    return (
      <SearchModal
        placeholderText={t('search.placeholders.guidebook')}
        fromPosition={position}
        object="guidebooks"
        open={searchModalOpen}
        onOpenChange={handleSearchModalOpenChange}
        send={updateObject}
      />
    )
  }

  // Methods: Core element rendering
  const imageElement = (
    <div className="GuidebookImage" onClick={openSearchModal}>
      <img
        alt={guidebook?.name[locale]}
        className={classNames({
          GridImage: true,
          Placeholder: imageUrl === '',
        })}
        src={imageUrl !== '' ? imageUrl : placeholderImageUrl}
      />
      {editable ? (
        <span className="icon">
          <PlusIcon />
        </span>
      ) : (
        ''
      )}
    </div>
  )

  const unitContent = (
    <>
      <div className={classes}>
        {contextMenu()}
        {imageElement}
        <h3 className="GuidebookName">{guidebook?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default GuidebookUnit
