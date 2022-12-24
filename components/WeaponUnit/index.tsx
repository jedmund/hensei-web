import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classnames from 'classnames'

import SearchModal from '~components/SearchModal'
import WeaponModal from '~components/WeaponModal'
import WeaponHovercard from '~components/WeaponHovercard'
import UncapIndicator from '~components/UncapIndicator'
import Button from '~components/Button'

import type { SearchableObject } from '~types'

import { appState } from '~utils/appState'
import { axData } from '~utils/axData'
import { weaponAwakening } from '~utils/awakening'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'
import './index.scss'

interface Props {
  gridWeapon: GridWeapon | undefined
  unitType: 0 | 1
  position: number
  editable: boolean
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
}

const WeaponUnit = (props: Props) => {
  const { t } = useTranslation('common')

  const [imageUrl, setImageUrl] = useState('')

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const classes = classnames({
    WeaponUnit: true,
    mainhand: props.unitType == 0,
    grid: props.unitType == 1,
    editable: props.editable,
    filled: props.gridWeapon !== undefined,
    empty: props.gridWeapon == undefined,
  })

  const gridWeapon = props.gridWeapon
  const weapon = gridWeapon?.object

  useEffect(() => {
    generateImageUrl()
  })

  function generateImageUrl() {
    let imgSrc = ''
    if (props.gridWeapon) {
      const weapon = props.gridWeapon.object!

      if (props.unitType == 0) {
        if (props.gridWeapon.object.element == 0 && props.gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}_${props.gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${weapon.granblue_id}.jpg`
      } else {
        if (props.gridWeapon.object.element == 0 && props.gridWeapon.element)
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${props.gridWeapon.element}.jpg`
        else
          imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
      }
    }

    setImageUrl(imgSrc)
  }

  function awakeningImage() {
    if (
      props.gridWeapon &&
      props.gridWeapon.object.awakening &&
      props.gridWeapon.awakening &&
      props.gridWeapon.awakening.type >= 0
    ) {
      const awakening = weaponAwakening.find(
        (awakening) => awakening.id === props.gridWeapon?.awakening?.type
      )
      const name = awakening?.name[locale]

      return (
        <img
          alt={`${name} Lv${props.gridWeapon.awakening.level}`}
          className="Awakening"
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/weapon_${props.gridWeapon.awakening.type}.png`}
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
      props.gridWeapon &&
      props.gridWeapon.object.series === 3 &&
      props.gridWeapon.weapon_keys
    ) {
      if (index === 0 && props.gridWeapon.weapon_keys[0]) {
        altText = `${props.gridWeapon.weapon_keys[0].name[locale]}`
        filename = `${props.gridWeapon.weapon_keys[0].slug}.png`
      } else if (index === 1 && props.gridWeapon.weapon_keys[1]) {
        altText = `${props.gridWeapon.weapon_keys[1].name[locale]}`

        const element = props.gridWeapon.object.element
        filename = `${props.gridWeapon.weapon_keys[1].slug}-${element}.png`
      }

      return (
        <img
          alt={`${altText}`}
          className="Skill"
          src={`${baseUrl}${filename}`}
        />
      )
    }
  }

  function opusImage(index: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-keys/`
    let filename = ''
    let altText = ''

    // If there is a grid weapon, it is a Dark Opus Weapon and it has keys
    if (
      props.gridWeapon &&
      props.gridWeapon.object.series === 2 &&
      props.gridWeapon.weapon_keys
    ) {
      if (
        props.gridWeapon.weapon_keys[index] &&
        props.gridWeapon.weapon_keys[index].slot === 0
      ) {
        altText = `${props.gridWeapon.weapon_keys[index].name[locale]}`
        filename = `${props.gridWeapon.weapon_keys[index].slug}.png`
      } else if (
        props.gridWeapon.weapon_keys[index] &&
        props.gridWeapon.weapon_keys[index].slot === 1
      ) {
        altText = `${props.gridWeapon.weapon_keys[index].name[locale]}`

        const element = props.gridWeapon.object.element
        const mod = props.gridWeapon.object.name.en.includes('Repudiation')
          ? 'primal'
          : 'magna'

        const suffix = `${mod}-${element}`
        const weaponKey = props.gridWeapon.weapon_keys[index]

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
          filename = `${props.gridWeapon.weapon_keys[index].slug}-${suffix}.png`
        } else {
          filename = `${props.gridWeapon.weapon_keys[index].slug}.png`
        }
      }

      return (
        <img
          alt={`${altText}`}
          className="Skill"
          src={`${baseUrl}${filename}`}
        />
      )
    }
  }

  function opusImages() {
    let images: JSX.Element[] = []
    if (
      props.gridWeapon &&
      props.gridWeapon.weapon_keys &&
      props.gridWeapon.weapon_keys.length > 0
    ) {
      for (let i = 0; i < props.gridWeapon.weapon_keys.length; i++) {
        const image = opusImage(i)
        if (image) images.push(image)
      }
    }

    return images
  }

  function axImage(index: number) {
    const axSkill = getCanonicalAxSkill(index)

    if (
      props.gridWeapon &&
      props.gridWeapon.object.ax &&
      props.gridWeapon.object.ax > 0 &&
      props.gridWeapon.ax &&
      axSkill
    ) {
      return (
        <img
          alt={`axskill`}
          className="Skill"
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/ax/${axSkill.slug}.png`}
        />
      )
    }
  }

  function getCanonicalAxSkill(index: number) {
    if (
      props.gridWeapon &&
      props.gridWeapon.object.ax &&
      props.gridWeapon.object.ax > 0 &&
      props.gridWeapon.ax
    ) {
      const axOptions = axData[props.gridWeapon.object.ax - 1]
      const weaponAxSkill: SimpleAxSkill = props.gridWeapon.ax[0]

      let axSkill = axOptions.find((ax) => ax.id === weaponAxSkill.modifier)

      if (index !== 0 && axSkill && axSkill.secondary) {
        const weaponSubAxSkill: SimpleAxSkill = props.gridWeapon.ax[1]
        axSkill = axSkill.secondary.find(
          (ax) => ax.id === weaponSubAxSkill.modifier
        )
      }

      return axSkill
    } else return
  }

  function passUncapData(uncap: number) {
    if (props.gridWeapon)
      props.updateUncap(props.gridWeapon.id, props.position, uncap)
  }

  function canBeModified(gridWeapon: GridWeapon) {
    const weapon = gridWeapon.object

    return (
      weapon.ax > 0 ||
      weapon.awakening ||
      (weapon.series && [2, 3, 17, 22, 24].includes(weapon.series))
    )
  }

  const image = (
    <div className="WeaponImage">
      <div className="Modifiers">
        {awakeningImage()}
        <div className="Skills">
          {axImage(0)}
          {axImage(1)}
          {telumaImage(0)}
          {telumaImage(1)}
          {opusImages()}
        </div>
      </div>
      <img alt={weapon?.name.en} className="grid_image" src={imageUrl} />
      {props.editable ? (
        <span className="icon">
          <PlusIcon />
        </span>
      ) : (
        ''
      )}
    </div>
  )

  const editableImage = (
    <SearchModal
      placeholderText={t('search.placeholders.weapon')}
      fromPosition={props.position}
      object="weapons"
      send={props.updateObject}
    >
      {image}
    </SearchModal>
  )

  const unitContent = (
    <div className={classes}>
      {props.editable && gridWeapon && canBeModified(gridWeapon) ? (
        <WeaponModal gridWeapon={gridWeapon}>
          <div>
            <Button accessoryIcon={<SettingsIcon />} />
          </div>
        </WeaponModal>
      ) : (
        ''
      )}
      {props.editable ? editableImage : image}
      {gridWeapon ? (
        <UncapIndicator
          type="weapon"
          ulb={gridWeapon.object.uncap.ulb || false}
          flb={gridWeapon.object.uncap.flb || false}
          uncapLevel={gridWeapon.uncap_level}
          updateUncap={passUncapData}
          special={false}
        />
      ) : (
        ''
      )}
      <h3 className="WeaponName">{weapon?.name[locale]}</h3>
    </div>
  )

  const withHovercard = (
    <WeaponHovercard gridWeapon={gridWeapon!}>{unitContent}</WeaponHovercard>
  )

  return gridWeapon && !props.editable ? withHovercard : unitContent
}

export default WeaponUnit
