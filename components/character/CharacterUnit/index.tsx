'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslations } from 'next-intl'
import { AxiosResponse } from 'axios'
import classNames from 'classnames'
import cloneDeep from 'lodash.clonedeep'

import Alert from '~components/common/Alert'
import Button from '~components/common/Button'
import CharacterHovercard from '~components/character/CharacterHovercard'
import CharacterModal from '~components/character/CharacterModal'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/common/ContextMenu'
import ContextMenuItem from '~components/common/ContextMenuItem'
import SearchModal from '~components/search/SearchModal'
import UncapIndicator from '~components/uncap/UncapIndicator'

import api from '~utils/api'
import { appState } from '~utils/appState'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'

// Types
import type {
  CharacterOverMastery,
  GridCharacterObject,
  PerpetuityObject,
  SearchableObject,
} from '~types'

import styles from './index.module.scss'

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
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routerLocale = getCookie('NEXT_LOCALE')
  const locale =
    routerLocale && ['en', 'ja'].includes(routerLocale) ? routerLocale : 'en'

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
    unit: true,
    [styles.unit]: true,
    [styles.editable]: editable,
    [styles.filled]: gridCharacter !== undefined,
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
    let character = cloneDeep(gridCharacter)

    if (character.over_mastery) {
      const overMastery: CharacterOverMastery = [
        gridCharacter.over_mastery[0],
        gridCharacter.over_mastery[1],
        gridCharacter.over_mastery[2],
        gridCharacter.over_mastery[3],
      ]

      character.over_mastery = overMastery
    }

    appState.grid.characters[gridCharacter.position] = character
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

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-main/${character.granblue_id}_${suffix}.jpg`
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
                active={contextMenuOpen}
                floating={true}
                leftAccessoryIcon={<SettingsIcon />}
                className="options"
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
          <>
            {t.rich('modals.characters.messages.remove', {
              character: gridCharacter?.object.name[locale] || '',
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </>
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
        [styles.perpetuity]: true,
        [styles.empty]: !gridCharacter.perpetuity,
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

    const content = (
      <div
        className={styles.image}
        tabIndex={gridCharacter ? gridCharacter.position * 7 : 0}
        onClick={openSearchModal}
      >
        {image}
        {editable ? (
          <span className={styles.icon}>
            <PlusIcon />
          </span>
        ) : (
          ''
        )}
      </div>
    )

    return gridCharacter ? (
      <CharacterHovercard
        gridCharacter={gridCharacter}
        onTriggerClick={openSearchModal}
      >
        {content}
      </CharacterHovercard>
    ) : (
      content
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
        <h3 className={styles.name}>{character?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default CharacterUnit
