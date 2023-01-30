import React, { MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { Trans, useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'
import classNames from 'classnames'

import Alert from '~components/Alert'
import Button from '~components/Button'
import CharacterHovercard from '~components/CharacterHovercard'
import CharacterModal from '~components/CharacterModal'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/ContextMenu'
import ContextMenuItem from '~components/ContextMenuItem'
import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'

import api from '~utils/api'
import { appState } from '~utils/appState'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'

// Types
import type {
  GridCharacterObject,
  PerpetuityObject,
  SearchableObject,
} from '~types'

import './index.scss'

interface Props {
  gridCharacter?: GridCharacter
  position: number
  editable: boolean
  removeCharacter: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
  updateTranscendence: (id: string, position: number, stage: number) => void
}

const CharacterUnit = ({
  gridCharacter,
  position,
  editable,
  removeCharacter: sendCharacterToRemove,
  updateObject,
  updateUncap,
  updateTranscendence,
}: Props) => {
  // Translations and locale
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // State snapshot
  const { party, grid } = useSnapshot(appState)

  // State: UI
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  // State: Other
  const [imageUrl, setImageUrl] = useState('')

  // Classes
  const classes = classNames({
    CharacterUnit: true,
    editable: editable,
    filled: gridCharacter !== undefined,
  })

  const buttonClasses = classNames({
    Options: true,
    Clicked: contextMenuOpen,
  })

  // Other
  const character = gridCharacter?.object

  // Hooks
  useEffect(() => {
    generateImageUrl()
  })

  // Methods: Open layer
  function openCharacterModal(event: Event) {
    setDetailsModalOpen(true)
  }

  function openSearchModal() {
    if (editable) setSearchModalOpen(true)
  }

  function openRemoveCharacterAlert() {
    setAlertOpen(true)
  }

  // Methods: Handle button clicked
  function handleButtonClicked() {
    setContextMenuOpen(!contextMenuOpen)
  }

  function handlePerpetuityClick() {
    if (gridCharacter) {
      let object: PerpetuityObject = {
        character: { perpetuity: !gridCharacter.perpetuity },
      }

      updateCharacter(object)
    }
  }

  // Methods: Handle open change
  function handleCharacterModalOpenChange(open: boolean) {
    setDetailsModalOpen(open)
  }

  function handleSearchModalOpenChange(open: boolean) {
    setSearchModalOpen(open)
  }

  function handleContextMenuOpenChange(open: boolean) {
    if (!open) setContextMenuOpen(false)
  }

  // Methods: Mutate data

  // Send the GridWeaponObject to the server
  async function updateCharacter(
    object: GridCharacterObject | PerpetuityObject
  ) {
    if (gridCharacter)
      return await api.endpoints.grid_characters
        .update(gridCharacter.id, object)
        .then((response) => processResult(response))
        .catch((error) => processError(error))
  }

  // Save the server's response to state
  function processResult(response: AxiosResponse) {
    const gridCharacter: GridCharacter = response.data
    appState.grid.characters[gridCharacter.position] = gridCharacter
  }

  function processError(error: any) {
    console.error(error)
  }

  function passUncapData(uncap: number) {
    if (gridCharacter) updateUncap(gridCharacter.id, position, uncap)
  }

  function passTranscendenceData(stage: number) {
    if (gridCharacter) updateTranscendence(gridCharacter.id, position, stage)
  }

  function removeCharacter() {
    if (gridCharacter) sendCharacterToRemove(gridCharacter.id)
    setAlertOpen(false)
  }

  // Methods: Image string generation
  function generateImageUrl() {
    let imgSrc = ''

    if (gridCharacter) {
      const character = gridCharacter.object!

      // Change the image based on the uncap level
      let suffix = '01'
      if (gridCharacter.transcendence_step > 0) suffix = '04'
      else if (gridCharacter.uncap_level >= 5) suffix = '03'
      else if (gridCharacter.uncap_level > 2) suffix = '02'

      // Special casing for Lyria (and Young Cat eventually)
      if (gridCharacter.object.granblue_id === '3030182000') {
        let element = 1
        if (grid.weapons.mainWeapon && grid.weapons.mainWeapon.element) {
          element = grid.weapons.mainWeapon.element
        } else if (party.element != 0) {
          element = party.element
        }

        suffix = `${suffix}_0${element}`
      }

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-main/${character.granblue_id}_${suffix}.jpg`
    }

    setImageUrl(imgSrc)
  }

  // Methods: Layer element rendering
  const characterModal = () => {
    if (gridCharacter) {
      return (
        <CharacterModal
          gridCharacter={gridCharacter}
          open={detailsModalOpen}
          onOpenChange={handleCharacterModalOpenChange}
          updateCharacter={updateCharacter}
        />
      )
    }
  }

  const contextMenu = () => {
    if (editable && gridCharacter && gridCharacter.id) {
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
              <ContextMenuItem onSelect={openCharacterModal}>
                {t('context.modify.character')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={openRemoveCharacterAlert}>
                {t('context.remove')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {characterModal()}
          {removeAlert()}
        </>
      )
    }
  }

  const removeAlert = () => {
    return (
      <Alert
        open={alertOpen}
        primaryAction={removeCharacter}
        primaryActionText={t('modals.characters.buttons.remove')}
        cancelAction={() => setAlertOpen(false)}
        cancelActionText={t('buttons.cancel')}
        message={
          <Trans i18nKey="modals.characters.messages.remove">
            Are you sure you want to remove{' '}
            <strong>{{ character: gridCharacter?.object.name[locale] }}</strong>{' '}
            from your team?
          </Trans>
        }
      />
    )
  }

  const searchModal = () => {
    if (editable) {
      return (
        <SearchModal
          placeholderText={t('search.placeholders.character')}
          fromPosition={position}
          object="characters"
          open={searchModalOpen}
          onOpenChange={handleSearchModalOpenChange}
          send={updateObject}
        />
      )
    }
  }

  // Methods: Core element rendering
  const perpetuity = () => {
    if (gridCharacter) {
      const classes = classNames({
        Perpetuity: true,
        Empty: !gridCharacter.perpetuity,
      })

      return <i className={classes} onClick={handlePerpetuityClick} />
    }
  }

  const image = () => {
    let image = (
      <img
        alt={character?.name[locale]}
        className="grid_image"
        src={imageUrl}
      />
    )

    if (gridCharacter) {
      image = (
        <CharacterHovercard
          gridCharacter={gridCharacter}
          onTriggerClick={openSearchModal}
        >
          {image}
        </CharacterHovercard>
      )
    }

    return (
      <div
        className="CharacterImage"
        tabIndex={gridCharacter ? gridCharacter.position * 7 : 0}
        onClick={openSearchModal}
      >
        {image}
        {editable ? (
          <span className="icon">
            <PlusIcon />
          </span>
        ) : (
          ''
        )}
      </div>
    )
  }

  const unitContent = (
    <>
      <div className={classes}>
        {contextMenu()}
        {perpetuity()}
        {image()}
        {gridCharacter && character ? (
          <UncapIndicator
            type="character"
            flb={character.uncap.flb || false}
            ulb={character.uncap.ulb || false}
            uncapLevel={gridCharacter.uncap_level}
            transcendenceStage={gridCharacter.transcendence_step}
            position={gridCharacter.position}
            editable={editable}
            updateUncap={passUncapData}
            updateTranscendence={passTranscendenceData}
            special={character.special}
          />
        ) : (
          ''
        )}
        <h3 className="CharacterName">{character?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default CharacterUnit
