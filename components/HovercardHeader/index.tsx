import { useRouter } from 'next/router'

import UncapIndicator from '~components/uncap/UncapIndicator'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'
import { ElementMap } from '~utils/elements'

import styles from './index.module.scss'

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
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const overlay = () => {
    if (type === 'character') {
      const gridCharacter = gridObject as GridCharacter
      if (gridCharacter.mastery.perpetuity)
        return <i className={styles.perpetuity} />
    } else if (type === 'summon') {
      const gridSummon = gridObject as GridSummon
      if (gridSummon.quickSummon) return <i className={styles.quickSummon} />
    }
  }

  const characterImage = () => {
    const gridCharacter = gridObject as GridCharacter
    const character = object as Character

    // Change the image based on the uncap level
    let suffix = '01'
    if (gridCharacter.uncapLevel == 6) suffix = '04'
    else if (gridCharacter.uncapLevel == 5) suffix = '03'
    else if (gridCharacter.uncapLevel > 2) suffix = '02'

    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-grid/${character.granblueId}_${suffix}.jpg`
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
      upgradedSummons.indexOf(summon.granblueId.toString()) != -1 &&
      gridSummon.uncapLevel == 5
    ) {
      suffix = '_02'
    } else if (
      gridSummon.object.uncap.xlb &&
      gridSummon.transcendenceStep > 0
    ) {
      suffix = '_03'
    }

    // Generate the correct source for the summon
    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblueId}${suffix}.jpg`
  }

  const weaponImage = () => {
    const gridWeapon = gridObject as GridWeapon
    const weapon = object as Weapon

    if (gridWeapon.object.element === ElementMap.null && gridWeapon.element)
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblueId}_${gridWeapon.element}.jpg`
    else
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblueId}.jpg`
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
        <div className={styles.icons}>
          <WeaponLabelIcon labelType={object.element.slug} />
          {'proficiency' in object && Array.isArray(object.proficiency) && (
            <WeaponLabelIcon labelType={Proficiency[object.proficiency[0]]} />
          )}
          {'proficiency' in object && !Array.isArray(object.proficiency) && (
            <WeaponLabelIcon labelType={Proficiency[object.proficiency]} />
          )}
          {'proficiency' in object &&
            Array.isArray(object.proficiency) &&
            object.proficiency.length > 1 && (
              <WeaponLabelIcon labelType={Proficiency[object.proficiency[1]]} />
            )}
        </div>
        <UncapIndicator
          type={type}
          ulb={object.uncap.ulb || false}
          flb={object.uncap.flb || false}
          transcendenceStage={
            'transcendenceStep' in gridObject ? gridObject.transcendenceStep : 0
          }
          special={'special' in object ? object.special : false}
        />
      </div>
    </header>
  )
}

export default HovercardHeader
