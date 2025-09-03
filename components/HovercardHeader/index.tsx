'use client'
import { getCookie } from 'cookies-next'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props {
  gridObject: GridCharacter | GridSummon | GridWeapon
  object: Character | Summon | Weapon
  type: 'character' | 'summon' | 'weapon'
}

const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
const Proficiency = [
  'none',
  'sword',
  'dagger',
  'axe',
  'spear',
  'bow',
  'staff',
  'fist',
  'harp',
  'gun',
  'katana',
]

const HovercardHeader = ({ gridObject, object, type, ...props }: Props) => {
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  const overlay = () => {
    if (type === 'character') {
      const gridCharacter = gridObject as GridCharacter
      if (gridCharacter.perpetuity) return <i className={styles.perpetuity} />
    } else if (type === 'summon') {
      const gridSummon = gridObject as GridSummon
      if (gridSummon.quick_summon) return <i className={styles.quickSummon} />
    }
  }

  const characterImage = () => {
    const gridCharacter = gridObject as GridCharacter
    const character = object as Character

    // Change the image based on the uncap level
    let suffix = '01'
    if (gridCharacter.uncap_level == 6) suffix = '04'
    else if (gridCharacter.uncap_level == 5) suffix = '03'
    else if (gridCharacter.uncap_level > 2) suffix = '02'

    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-grid/${character.granblue_id}_${suffix}.jpg`
  }

  const summonImage = () => {
    const summon = object as Summon
    const gridSummon = gridObject as GridSummon

    const upgradedSummons = [
      '2040094000',
      '2040100000',
      '2040080000',
      '2040098000',
      '2040090000',
      '2040084000',
      '2040003000',
      '2040056000',
    ]

    let suffix = ''
    if (
      upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 &&
      gridSummon.uncap_level == 5
    ) {
      suffix = '_02'
    } else if (
      gridSummon.object.uncap.transcendence &&
      gridSummon.transcendence_step > 0
    ) {
      suffix = '_03'
    }

    // Generate the correct source for the summon
    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
  }

  const weaponImage = () => {
    const gridWeapon = gridObject as GridWeapon
    const weapon = object as Weapon

    if (gridWeapon.object.element == 0 && gridWeapon.element)
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
    else
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
  }

  const image = () => {
    switch (type) {
      case 'character':
        return characterImage()
      case 'summon':
        return summonImage()
      case 'weapon':
        return weaponImage()
    }
  }

  const summonProficiency = (
    <div className={styles.icons}>
      <WeaponLabelIcon labelType={Element[object.element]} size="small" />
    </div>
  )

  const weaponProficiency = (
    <div className={styles.icons}>
      <WeaponLabelIcon labelType={Element[object.element]} size="small" />
      {'proficiency' in object && !Array.isArray(object.proficiency) && (
        <WeaponLabelIcon
          labelType={Proficiency[object.proficiency]}
          size="small"
        />
      )}
    </div>
  )

  const characterProficiency = (
    <div
      className={classNames({
        [styles.icons]: true,
      })}
    >
      <WeaponLabelIcon labelType={Element[object.element]} size="small" />

      {'proficiency' in object && Array.isArray(object.proficiency) && (
        <WeaponLabelIcon
          labelType={Proficiency[object.proficiency[0]]}
          size="small"
        />
      )}

      {'proficiency' in object &&
        Array.isArray(object.proficiency) &&
        object.proficiency.length > 1 && (
          <WeaponLabelIcon
            labelType={Proficiency[object.proficiency[1]]}
            size="small"
          />
        )}
    </div>
  )

  function proficiency() {
    switch (type) {
      case 'character':
        return characterProficiency
      case 'summon':
        return summonProficiency
      case 'weapon':
        return weaponProficiency
    }
  }

  return (
    <header className={styles.root}>
      <div className={styles.title}>
        <h4>{object.name[locale]}</h4>
        <div className={styles.image}>
          {overlay()}
          <img alt={object.name[locale]} src={image()} />
        </div>
      </div>
      <div className={styles.subInfo}>
        {proficiency()}
        <UncapIndicator
          className="hovercard"
          type={type}
          ulb={object.uncap.ulb || false}
          flb={object.uncap.flb || false}
          transcendenceStage={
            'transcendence_step' in gridObject
              ? gridObject.transcendence_step
              : 0
          }
          special={'special' in object ? object.special : false}
        />
      </div>
    </header>
  )
}

export default HovercardHeader
