import React, { MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'
import classNames from 'classnames'

import api from '~utils/api'
import { appState } from '~utils/appState'

import Alert from '~components/common/Alert'
import Button from '~components/common/Button'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/common/ContextMenu'
import ContextMenuItem from '~components/common/ContextMenuItem'
import SearchModal from '~components/search/SearchModal'
import SummonHovercard from '~components/summon/SummonHovercard'
import UncapIndicator from '~components/uncap/UncapIndicator'

import type { SearchableObject } from '~types'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import styles from './index.module.scss'

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
    unit: true,
    [styles.unit]: true,
    [styles.main]: unitType == 0,
    [styles.grid]: unitType == 1,
    [styles.friend]: unitType == 2,
    [styles.subaura]: position == 4 || position == 5,
    [styles.editable]: editable,
    [styles.filled]: gridSummon !== undefined,
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

  function handleQuickSummonClick() {
    if (gridSummon) updateQuickSummon(!gridSummon.quick_summon)
  }

  // Methods: Handle open change
  function handleContextMenuOpenChange(open: boolean) {
    if (!open) setContextMenuOpen(false)
  }

  function handleSearchModalOpenChange(open: boolean) {
    setSearchModalOpen(open)
  }

  // Methods: Mutate data

  // Send the GridSummonObject to the server
  async function updateQuickSummon(value: boolean) {
    if (gridSummon)
      return await api
        .updateQuickSummon({ id: gridSummon.id, value: value })
        .then((response) => processResult(response))
        .catch((error) => processError(error))
  }

  // Save the server's response to state
  function processResult(response: AxiosResponse) {
    // TODO: We will have to update multiple grid summons at once
    // because there can only be one at once.
    // If a user sets a quick summon while one is already set,
    // the previous one will be unset.
    const gridSummons: GridSummon[] = response.data.summons
    for (const gridSummon of gridSummons) {
      if (gridSummon.main) {
        appState.grid.summons.mainSummon = gridSummon
      } else if (gridSummon.friend) {
        appState.grid.summons.friendSummon = gridSummon
      } else {
        appState.grid.summons.allSummons[gridSummon.position] = gridSummon
      }
    }
  }

  function processError(error: any) {
    console.error(error)
  }

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
        if (
          gridSummon.transcendence_step >= 1 &&
          gridSummon.transcendence_step < 5
        ) {
          suffix = '_03'
        } else if (gridSummon.transcendence_step === 5) {
          suffix = '_04'
        }
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
                active={contextMenuOpen}
                floating={true}
                className="options"
                leftAccessoryIcon={<SettingsIcon />}
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
  const quickSummon = () => {
    if (gridSummon) {
      const classes = classNames({
        [styles.quickSummon]: true,
        [styles.empty]: !gridSummon.quick_summon,
      })

      return <i className={classes} onClick={handleQuickSummonClick} />
    }
  }

  const image = () => {
    let image = (
      <img
        alt={summon?.name[locale]}
        className={classNames({
          [styles.image]: true,
          [styles.placeholder]: imageUrl === '',
        })}
        src={imageUrl !== '' ? imageUrl : placeholderImageUrl()}
      />
    )

    const content = (
      <div className={styles.content} onClick={openSearchModal}>
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
        {quickSummon()}
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
        <h3 className={styles.name}>{summon?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default SummonUnit
