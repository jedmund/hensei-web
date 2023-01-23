import React, { useEffect, useState, MouseEvent } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Alert from '~components/Alert'
import SearchModal from '~components/SearchModal'
import WeaponModal from '~components/WeaponModal'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/ContextMenu'
import ContextMenuItem from '~components/ContextMenuItem'
import WeaponHovercard from '~components/WeaponHovercard'
import UncapIndicator from '~components/UncapIndicator'
import Button from '~components/Button'

import type { SearchableObject } from '~types'

import ax from '~data/ax'
import { weaponAwakening } from '~data/awakening'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import './index.scss'

interface Props {
  gridWeapon: GridWeapon | undefined
  unitType: 0 | 1
  position: number
  editable: boolean
  removeWeapon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
}

const WeaponUnit = ({
  gridWeapon,
  unitType,
  position,
  editable,
  removeWeapon: sendWeaponToRemove,
  updateObject,
  updateUncap,
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
    WeaponUnit: true,
    mainhand: unitType == 0,
    grid: unitType == 1,
    editable: editable,
    filled: gridWeapon !== undefined,
    empty: gridWeapon == undefined,
  })

  const buttonClasses = classNames({
    Options: true,
    Clicked: contextMenuOpen,
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
      weapon.awakening ||
      (weapon.series && [2, 3, 17, 22, 24].includes(weapon.series))
    )
  }

  // Methods: Open layer
  function openWeaponModal(event: Event) {
    setDetailsModalOpen(true)
  }

  function openSearchModal(event: MouseEvent<HTMLDivElement>) {
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

  function removeWeapon() {
    if (gridWeapon) sendWeaponToRemove(gridWeapon.id)
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

      if (unitType == 0) {
        if (gridWeapon.object.element == 0 && gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}_${gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}.jpg`
      } else {
        if (gridWeapon.object.element == 0 && gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
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
      gridWeapon.object.awakening &&
      gridWeapon.awakening &&
      gridWeapon.awakening.type > 0 &&
      gridWeapon.awakening.type != null
    ) {
      const awakening = weaponAwakening.find(
        (awakening) => awakening.id === gridWeapon?.awakening?.type
      )
      const name = awakening?.name[locale]

      return (
        <img
          alt={`${name} Lv${gridWeapon.awakening.level}`}
          className="Awakening"
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/weapon_${gridWeapon.awakening.type}.png`}
        />
      )
    }
  }

  function telumaImage(index: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-keys/`
    let filename = ''
    let altText = ''

    // If there is a grid weapon, it is a Draconic Weapon and it has keys
    if (
      gridWeapon &&
      gridWeapon.object.series === 3 &&
      gridWeapon.weapon_keys
    ) {
      if (index === 0 && gridWeapon.weapon_keys[0]) {
        altText = `${gridWeapon.weapon_keys[0].name[locale]}`
        filename = `${gridWeapon.weapon_keys[0].slug}.png`
      } else if (index === 1 && gridWeapon.weapon_keys[1]) {
        altText = `${gridWeapon.weapon_keys[1].name[locale]}`

        const element = gridWeapon.object.element
        filename = `${gridWeapon.weapon_keys[1].slug}-${element}.png`
      }

      return (
        <img
          alt={altText}
          key={altText}
          className="Skill"
          src={`${baseUrl}${filename}`}
        />
      )
    }
  }

  function telumaImages() {
    let images: JSX.Element[] = []
    if (
      gridWeapon &&
      gridWeapon.object.series === 3 &&
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
    let filename = ''
    let altText = ''

    // If there is a grid weapon, it is a Dark Opus Weapon and it has keys
    if (
      gridWeapon &&
      gridWeapon.object.series === 17 &&
      gridWeapon.weapon_keys
    ) {
      if (
        gridWeapon.weapon_keys[index] &&
        (gridWeapon.weapon_keys[index].slot === 1 ||
          gridWeapon.weapon_keys[index].slot === 2)
      ) {
        altText = `${gridWeapon.weapon_keys[index].name[locale]}`
        filename = `${gridWeapon.weapon_keys[index].slug}.png`
      } else if (
        gridWeapon.weapon_keys[index] &&
        gridWeapon.weapon_keys[index].slot === 0
      ) {
        altText = `${gridWeapon.weapon_keys[index].name[locale]}`

        const weapon = gridWeapon.object.proficiency

        const suffix = `${weapon}`
        filename = `${gridWeapon.weapon_keys[index].slug}-${suffix}.png`
      }
    }

    return (
      <img
        alt={altText}
        key={altText}
        className="Skill"
        src={`${baseUrl}${filename}`}
      />
    )
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
    let filename = ''
    let altText = ''

    // If there is a grid weapon, it is a Dark Opus Weapon and it has keys
    if (
      gridWeapon &&
      gridWeapon.object.series === 2 &&
      gridWeapon.weapon_keys
    ) {
      if (
        gridWeapon.weapon_keys[index] &&
        gridWeapon.weapon_keys[index].slot === 0
      ) {
        altText = `${gridWeapon.weapon_keys[index].name[locale]}`
        filename = `${gridWeapon.weapon_keys[index].slug}.png`
      } else if (
        gridWeapon.weapon_keys[index] &&
        gridWeapon.weapon_keys[index].slot === 1
      ) {
        altText = `${gridWeapon.weapon_keys[index].name[locale]}`

        const element = gridWeapon.object.element
        const mod = gridWeapon.object.name.en.includes('Repudiation')
          ? 'primal'
          : 'magna'

        const suffix = `${mod}-${element}`
        const weaponKey = gridWeapon.weapon_keys[index]

        if (
          [
            'pendulum-strength',
            'pendulum-zeal',
            'pendulum-strife',
            'chain-temperament',
            'chain-restoration',
            'chain-glorification',
          ].includes(weaponKey.slug)
        ) {
          filename = `${gridWeapon.weapon_keys[index].slug}-${suffix}.png`
        } else {
          filename = `${gridWeapon.weapon_keys[index].slug}.png`
        }
      }

      return (
        <img
          alt={altText}
          key={altText}
          className="Skill"
          src={`${baseUrl}${filename}`}
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
          className="Skill"
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
      for (let i = 0; i < gridWeapon.ax.length; i++) {
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
                accessoryIcon={<SettingsIcon />}
                className={buttonClasses}
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
  const image = (
    <div className="WeaponImage" onClick={openSearchModal}>
      <div className="Modifiers">
        {awakeningImage()}
        <div className="Skills">
          {axImages()}
          {telumaImages()}
          {opusImages()}
          {ultimaImages()}
        </div>
      </div>
      <img
        alt={weapon?.name[locale]}
        className={classNames({
          GridImage: true,
          Placeholder: imageUrl === '',
        })}
        src={imageUrl !== '' ? imageUrl : placeholderImageUrl()}
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
        {image}
        {gridWeapon && weapon ? (
          <UncapIndicator
            type="weapon"
            ulb={gridWeapon.object.uncap.ulb || false}
            flb={gridWeapon.object.uncap.flb || false}
            uncapLevel={gridWeapon.uncap_level}
            position={gridWeapon.position}
            updateUncap={passUncapData}
            special={false}
          />
        ) : (
          ''
        )}
        <h3 className="WeaponName">{weapon?.name[locale]}</h3>
      </div>
      {searchModal()}
    </>
  )

  const unitContentWithHovercard = (
    <WeaponHovercard gridWeapon={gridWeapon!}>{unitContent}</WeaponHovercard>
  )

  return gridWeapon && !editable ? unitContentWithHovercard : unitContent
}

export default WeaponUnit
