import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'

import api from '~utils/api'
import { appState } from '~utils/appState'

import Alert from '~components/common/Alert'
import SearchModal from '~components/search/SearchModal'
import WeaponModal from '~components/weapon/WeaponModal'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/common/ContextMenu'
import ContextMenuItem from '~components/common/ContextMenuItem'
import WeaponHovercard from '~components/weapon/WeaponHovercard'
import UncapIndicator from '~components/uncap/UncapIndicator'
import Button from '~components/common/Button'

import type { GridWeaponObject, SearchableObject } from '~types'

import ax from '~data/ax'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import styles from './index.module.scss'

interface Props {
  gridWeapon: GridWeapon | undefined
  unitType: 0 | 1
  position: number
  editable: boolean
  removeWeapon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
  updateTranscendence: (id: string, position: number, stage: number) => void
}

const WeaponUnit = ({
  gridWeapon,
  unitType,
  position,
  editable,
  removeWeapon: sendWeaponToRemove,
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
    [styles.extra]: position >= 9,
    [styles.mainhand]: unitType == 0,
    [styles.weapon]: unitType == 1,
    [styles.editable]: editable,
    [styles.filled]: gridWeapon !== undefined,
    [styles.empty]: gridWeapon == undefined,
  })

  // Other
  const weapon = gridWeapon?.object

  // Hooks
  useEffect(() => {
    generateImageUrl()
  })

  // Methods: Convenience
  function canBeModified(gridWeapon: GridWeapon) {
    const weapon = gridWeapon.object

    return (
      weapon.ax ||
      weapon.awakenings ||
      (weapon.series && [2, 3, 17, 22, 24, 34].includes(weapon.series))
    )
  }

  // Methods: Open layer
  function openWeaponModal(event: Event) {
    setDetailsModalOpen(true)
  }

  function openSearchModal() {
    if (editable) setSearchModalOpen(true)
  }

  function openRemoveWeaponAlert() {
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

  function handleWeaponModalOpenChange(open: boolean) {
    setDetailsModalOpen(open)
  }

  function handleSearchModalOpenChange(open: boolean) {
    setSearchModalOpen(open)
  }

  // Methods: Mutate data
  function passUncapData(index: number) {
    if (gridWeapon) updateUncap(gridWeapon.id, position, index)
  }

  function passTranscendenceData(stage: number) {
    if (gridWeapon) updateTranscendence(gridWeapon.id, position, stage)
  }

  function removeWeapon() {
    if (gridWeapon) sendWeaponToRemove(gridWeapon.id)
    setAlertOpen(false)
  }

  // Methods: Data fetching and manipulation

  async function updateWeapon(object: GridWeaponObject) {
    if (gridWeapon) {
      return await api.endpoints.grid_weapons
        .update(gridWeapon.id, object)
        .then((response) => processResult(response))
        .catch((error) => processError(error))
    }
  }

  function processResult(response: AxiosResponse) {
    const gridWeapon: GridWeapon = response.data

    if (gridWeapon.mainhand) {
      appState.grid.weapons.mainWeapon = gridWeapon
      appState.party.element = gridWeapon.object.element
    } else if (!gridWeapon.mainhand && gridWeapon.position !== null) {
      let weapon = clonedeep(gridWeapon)
      if (weapon.object.element === 0 && weapon.element < 1)
        weapon.element = gridWeapon.object.element

      appState.grid.weapons.allWeapons[gridWeapon.position] = weapon
    }
  }

  function processError(error: any) {
    console.error(error)
  }

  // Methods: Data fetching and manipulation
  function getCanonicalAxSkill(index: number) {
    if (
      gridWeapon &&
      gridWeapon.object.ax &&
      gridWeapon.object.ax_type > 0 &&
      gridWeapon.ax
    ) {
      const axOptions = ax[gridWeapon.object.ax_type - 1]
      const weaponAxSkill: SimpleAxSkill = gridWeapon.ax[0]

      let axSkill = axOptions.find((ax) => ax.id === weaponAxSkill.modifier)

      if (index !== 0 && axSkill && axSkill.secondary) {
        const weaponSubAxSkill: SimpleAxSkill = gridWeapon.ax[1]
        axSkill = axSkill.secondary.find(
          (ax) => ax.id === weaponSubAxSkill.modifier
        )
      }

      return axSkill
    } else return
  }

  // Methods: Image string generation
  function generateImageUrl() {
    let imgSrc = ''
    if (gridWeapon) {
      const weapon = gridWeapon.object!

      let suffix = ''
      if (weapon.uncap.transcendence && gridWeapon.uncap_level == 6) {
        if (
          gridWeapon.transcendence_step >= 1 &&
          gridWeapon.transcendence_step < 5
        ) {
          suffix = '_02'
        } else if (gridWeapon.transcendence_step === 5) {
          suffix = '_03'
        }
      }
      if (unitType == 0) {
        if (gridWeapon.object.element == 0 && gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}_${gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}${suffix}.jpg`
      } else {
        if (gridWeapon.object.element == 0 && gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}${suffix}.jpg`
      }
    }

    setImageUrl(imgSrc)
  }

  function placeholderImageUrl() {
    return unitType == 0
      ? '/images/placeholders/placeholder-weapon-main.png'
      : '/images/placeholders/placeholder-weapon-grid.png'
  }

  // Methods: Image element rendering
  function awakeningImage() {
    if (
      gridWeapon &&
      gridWeapon.object.awakenings &&
      gridWeapon.awakening &&
      gridWeapon.awakening.type
    ) {
      const awakening = gridWeapon.awakening
      return (
        <img
          alt={`${awakening.type.name[locale]} Lv${gridWeapon.awakening.level}`}
          className={styles.awakening}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/${gridWeapon.awakening.type.slug}.png`}
        />
      )
    }
  }

  function telumaImage(index: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-keys/`

    // If there is a grid weapon, it is a Draconic Weapon and it has keys
    if (
      gridWeapon &&
      (gridWeapon.object.series === 3 || gridWeapon.object.series == 34) &&
      gridWeapon.weapon_keys
    ) {
      const weaponKey = gridWeapon.weapon_keys[index]
      const altText = weaponKey.name[locale]
      let filename = `${weaponKey.slug}`

      let elementalTelumas = [15008, 16001, 16002]
      let granblueId = parseInt(weaponKey.granblue_id)

      if (elementalTelumas.includes(granblueId)) {
        filename += `-${gridWeapon.object.element}`
      }

      return (
        <img
          alt={altText}
          key={altText}
          className={styles.skill}
          src={`${baseUrl}${filename}.png`}
        />
      )
    }
  }

  function telumaImages() {
    let images: JSX.Element[] = []
    if (
      gridWeapon &&
      (gridWeapon.object.series === 3 || gridWeapon.object.series === 34) &&
      gridWeapon.weapon_keys &&
      gridWeapon.weapon_keys.length > 0
    ) {
      for (let i = 0; i < gridWeapon.weapon_keys.length; i++) {
        const image = telumaImage(i)
        if (image) images.push(image)
      }
    }

    return images
  }

  function ultimaImage(index: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-keys/`

    // If there is a grid weapon, it is a Dark Opus Weapon and it has keys
    if (
      gridWeapon &&
      gridWeapon.object.series === 17 &&
      gridWeapon.weapon_keys
    ) {
      const weaponKey = gridWeapon.weapon_keys[index]
      const altText = weaponKey.name[locale]
      let filename = weaponKey.slug

      if (weaponKey.slot === 0) {
        filename += `-${gridWeapon.object.proficiency}`
      }

      return (
        <img
          alt={altText}
          key={altText}
          className={styles.skill}
          src={`${baseUrl}${filename}.png`}
        />
      )
    }
  }

  function ultimaImages() {
    let images: JSX.Element[] = []
    if (
      gridWeapon &&
      gridWeapon.object.series === 17 &&
      gridWeapon.weapon_keys &&
      gridWeapon.weapon_keys.length > 0
    ) {
      for (let i = 0; i < gridWeapon.weapon_keys.length; i++) {
        const image = ultimaImage(i)
        if (image) images.push(image)
      }
    }

    return images
  }

  function opusImage(index: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-keys/`

    // If there is a grid weapon, it is a Dark Opus Weapon and it has keys
    if (
      gridWeapon &&
      gridWeapon.object.series === 2 &&
      gridWeapon.weapon_keys
    ) {
      const weaponKey = gridWeapon.weapon_keys[index]
      const altText = weaponKey.name[locale]
      let filename = weaponKey.slug

      if (weaponKey.slot === 1) {
        const element = gridWeapon.object.element
        const mod = gridWeapon.object.name.en.includes('Repudiation')
          ? 'primal'
          : 'magna'
        const suffixes = [
          'pendulum-strength',
          'pendulum-zeal',
          'pendulum-strife',
          'chain-temperament',
          'chain-restoration',
          'chain-glorification',
        ]

        if (suffixes.includes(weaponKey.slug)) {
          filename += `-${mod}-${element}`
        }
      }

      return (
        <img
          alt={altText}
          key={altText}
          className={styles.skill}
          src={`${baseUrl}${filename}.png`}
        />
      )
    }
  }

  function opusImages() {
    let images: JSX.Element[] = []
    if (
      gridWeapon &&
      gridWeapon.object.series === 2 &&
      gridWeapon.weapon_keys &&
      gridWeapon.weapon_keys.length > 0
    ) {
      for (let i = 0; i < gridWeapon.weapon_keys.length; i++) {
        const image = opusImage(i)
        if (image) images.push(image)
      }
    }

    return images
  }

  function axImage(index: number) {
    const axSkill = getCanonicalAxSkill(index)

    if (
      gridWeapon &&
      gridWeapon.object.ax &&
      gridWeapon.object.ax_type > 0 &&
      gridWeapon.ax &&
      axSkill
    ) {
      const altText = `${axSkill.name[locale]} Lv${gridWeapon.ax[index].strength}`
      return (
        <img
          alt={altText}
          key={altText}
          className={styles.skill}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/ax/${axSkill.slug}.png`}
        />
      )
    }
  }

  function axImages() {
    let images: JSX.Element[] = []
    if (
      gridWeapon &&
      gridWeapon.object.ax &&
      gridWeapon.ax &&
      gridWeapon.ax.length > 0
    ) {
      const numSkills = gridWeapon.ax[1].modifier ? 2 : 1
      for (let i = 0; i < numSkills; i++) {
        const image = axImage(i)
        if (image) images.push(image)
      }
    }

    return images
  }

  // Methods: Layer element rendering
  const weaponModal = () => {
    if (gridWeapon) {
      return (
        <WeaponModal
          gridWeapon={gridWeapon}
          open={detailsModalOpen}
          onOpenChange={handleWeaponModalOpenChange}
          updateWeapon={updateWeapon}
        />
      )
    }
  }

  const contextMenu = () => {
    if (editable && gridWeapon && gridWeapon.id) {
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
              {canBeModified(gridWeapon) ? (
                <ContextMenuItem onSelect={openWeaponModal}>
                  {t('context.modify.weapon')}
                </ContextMenuItem>
              ) : (
                ''
              )}
              <ContextMenuItem onSelect={openRemoveWeaponAlert}>
                {t('context.remove')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {weaponModal()}
          {removeAlert()}
        </>
      )
    }
  }

  const removeAlert = () => {
    return (
      <Alert
        open={alertOpen}
        primaryAction={removeWeapon}
        primaryActionText={t('modals.weapon.buttons.remove')}
        cancelAction={() => setAlertOpen(false)}
        cancelActionText={t('buttons.cancel')}
        message={
          <Trans i18nKey="modals.weapons.messages.remove">
            Are you sure you want to remove{' '}
            <strong>{{ weapon: gridWeapon?.object.name[locale] }}</strong> from
            your team?
          </Trans>
        }
      />
    )
  }

  const searchModal = () => {
    return (
      <SearchModal
        placeholderText={t('search.placeholders.weapon')}
        fromPosition={position}
        object="weapons"
        open={searchModalOpen}
        onOpenChange={handleSearchModalOpenChange}
        send={updateObject}
      />
    )
  }

  // Methods: Core element rendering
  const image = () => {
    const image = (
      <img
        alt={weapon?.name[locale]}
        className={classNames({
          // TODO: Look into this gridImage class
          [styles.gridImage]: true,
          [styles.placeholder]: imageUrl === '',
        })}
        src={imageUrl !== '' ? imageUrl : placeholderImageUrl()}
      />
    )

    const content = (
      <div className={styles.image} onClick={openSearchModal}>
        <div className={styles.modifiers}>
          {awakeningImage()}
          <div className={styles.skills}>
            {axImages()}
            {telumaImages()}
            {opusImages()}
            {ultimaImages()}
          </div>
        </div>
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

    return gridWeapon ? (
      <WeaponHovercard gridWeapon={gridWeapon} onTriggerClick={openSearchModal}>
        {content}
      </WeaponHovercard>
    ) : (
      content
    )
  }

  const unitContent = (
    <>
      <div className={classes}>
        {contextMenu()}
        {image()}
        {gridWeapon && (
          <UncapIndicator
            type="weapon"
            ulb={gridWeapon.object.uncap.ulb || false}
            flb={gridWeapon.object.uncap.flb || false}
            transcendence={gridWeapon.object.uncap.transcendence || false}
            editable={editable}
            uncapLevel={gridWeapon.uncap_level}
            transcendenceStage={gridWeapon.transcendence_step}
            position={gridWeapon.position}
            updateUncap={passUncapData}
            updateTranscendence={passTranscendenceData}
            special={false}
          />
        )}
        <h3 className={styles.name}>{weapon?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  return unitContent
}

export default WeaponUnit
