import React, { MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Alert from '~components/Alert'
import Button from '~components/Button'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/ContextMenu'
import ContextMenuItem from '~components/ContextMenuItem'
import SearchModal from '~components/SearchModal'
import SummonHovercard from '~components/SummonHovercard'
import UncapIndicator from '~components/UncapIndicator'

import type { SearchableObject } from '~types'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import './index.scss'

interface Props {
  gridSummon: GridSummon | undefined
  unitType: 0 | 1 | 2
  position: number
  editable: boolean
  removeSummon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
  updateTranscendence: (id: string, position: number, stage: number) => void
}

const SummonUnit = ({
  gridSummon,
  unitType,
  position,
  editable,
  removeSummon: sendSummonToRemove,
  updateObject,
  updateUncap,
  updateTranscendence,
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
    SummonUnit: true,
    main: unitType == 0,
    grid: unitType == 1,
    friend: unitType == 2,
    editable: editable,
    filled: gridSummon !== undefined,
  })

  const buttonClasses = classNames({
    Options: true,
    Clicked: contextMenuOpen,
  })

  // Other
  const summon = gridSummon?.object

  // Hooks
  useEffect(() => {
    generateImageUrl()
  })

  // Methods: Open layer
  function openSearchModal() {
    if (editable) setSearchModalOpen(true)
  }

  function openRemoveSummonAlert() {
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
  function passUncapData(uncap: number) {
    if (gridSummon) updateUncap(gridSummon.id, position, uncap)
  }

  function passTranscendenceData(stage: number) {
    if (gridSummon) updateTranscendence(gridSummon.id, position, stage)
  }

  function removeSummon() {
    if (gridSummon) sendSummonToRemove(gridSummon.id)
    setAlertOpen(false)
  }

  // Methods: Image string generation
  function generateImageUrl() {
    let imgSrc = ''
    if (gridSummon) {
      const summon = gridSummon.object!

      const upgradedSummons = [
        '2040094000',
        '2040100000',
        '2040080000',
        '2040098000',
        '2040090000',
        '2040084000',
        '2040003000',
        '2040056000',
        '2040020000',
        '2040034000',
        '2040028000',
        '2040027000',
        '2040046000',
        '2040047000',
      ]

      let suffix = ''
      if (gridSummon.object.uncap.xlb && gridSummon.uncap_level == 6) {
        suffix = '_03'
      } else if (
        upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 &&
        gridSummon.uncap_level == 5
      ) {
        suffix = '_02'
      }

      // Generate the correct source for the summon
      if (unitType == 0 || unitType == 2)
        imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-main/${summon.granblue_id}${suffix}.jpg`
      else
        imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
    }

    setImageUrl(imgSrc)
  }

  function placeholderImageUrl() {
    return unitType == 0 || unitType == 2
      ? '/images/placeholders/placeholder-summon-main.png'
      : '/images/placeholders/placeholder-summon-grid.png'
  }

  // Methods: Layer element rendering
  const contextMenu = () => {
    if (editable && gridSummon && gridSummon.id) {
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
              <ContextMenuItem onSelect={openRemoveSummonAlert}>
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
        primaryAction={removeSummon}
        primaryActionText={t('modals.summon.buttons.remove')}
        cancelAction={() => setAlertOpen(false)}
        cancelActionText={t('buttons.cancel')}
        message={
          <Trans i18nKey="modals.summons.messages.remove">
            Are you sure you want to remove{' '}
            <strong>{{ weapon: gridSummon?.object.name[locale] }}</strong> from
            your team?
          </Trans>
        }
      />
    )
  }

  const searchModal = () => {
    return (
      <SearchModal
        placeholderText={t('search.placeholders.summon')}
        fromPosition={position}
        object="summons"
        open={searchModalOpen}
        onOpenChange={handleSearchModalOpenChange}
        send={updateObject}
      />
    )
  }

  // Methods: Core element rendering
  const image = () => {
    let image = (
      <img
        alt={summon?.name[locale]}
        className={classNames({
          GridImage: true,
          Placeholder: imageUrl === '',
        })}
        src={imageUrl !== '' ? imageUrl : placeholderImageUrl()}
      />
    )

    const content = (
      <div className="SummonImage" onClick={openSearchModal}>
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

    return gridSummon ? (
      <SummonHovercard gridSummon={gridSummon} onTriggerClick={openSearchModal}>
        {content}
      </SummonHovercard>
    ) : (
      content
    )
  }

  const unitContent = (
    <>
      <div className={classes}>
        {contextMenu()}
        {image()}
        {gridSummon ? (
          <UncapIndicator
            type="summon"
            ulb={gridSummon.object.uncap.ulb || false}
            flb={gridSummon.object.uncap.flb || false}
            xlb={gridSummon.object.uncap.xlb || false}
            editable={editable}
            uncapLevel={gridSummon.uncap_level}
            transcendenceStage={gridSummon.transcendence_step}
            position={gridSummon.position}
            updateUncap={passUncapData}
            updateTranscendence={passTranscendenceData}
            special={false}
          />
        ) : (
          ''
        )}
        <h3 className="SummonName">{summon?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default SummonUnit
