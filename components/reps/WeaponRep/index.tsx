import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props {
  grid: {
    mainWeapon: GridWeapon | undefined
    allWeapons: GridArray<GridWeapon>
  }
}

const WEAPONS_COUNT = 9

const WeaponRep = (props: Props) => {
  // Localization for alt tags
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Component state
  const [mainhand, setMainhand] = useState<GridWeapon>()
  const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
  const [grid, setGrid] = useState<GridArray<GridWeapon>>({})

  // On grid update
  useEffect(() => {
    const newWeapons = Array(WEAPONS_COUNT)
    const gridWeapons = Array(WEAPONS_COUNT)

    if (props.grid.mainWeapon) {
      setMainhand(props.grid.mainWeapon)
    } else {
      setMainhand(undefined)
    }

    if (props.grid.allWeapons) {
      for (const [key, value] of Object.entries(props.grid.allWeapons)) {
        if (value) {
          newWeapons[value.position] = value.object
          gridWeapons[value.position] = value
        }
      }
    }

    setWeapons(newWeapons)
    setGrid(gridWeapons)
  }, [props.grid])

  // Methods: Image generation
  function generateMainhandImage() {
    let url = ''

    if (mainhand && mainhand.object) {
      if (mainhand.object.element == 0 && mainhand.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.object.granblue_id}_${mainhand.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.object.granblue_id}.jpg`
      }
    }

    return mainhand ? <img alt={mainhand.object.name[locale]} src={url} /> : ''
  }

  function generateGridImage(position: number) {
    let url = ''

    const weapon = weapons[position]
    const gridWeapon = grid[position]

    if (weapon && gridWeapon) {
      if (weapon.element == 0 && gridWeapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
      }
    }

    return weapons[position] ? (
      <img alt={weapons[position]?.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  // Render
  return (
    <div className={styles.rep}>
      <div className={styles.mainhand}>{generateMainhandImage()}</div>
      <ul className={styles.weapons}>
        {Array.from(Array(WEAPONS_COUNT)).map((x, i) => {
          return (
            <li key={`weapons-${i}`} className={styles.weapon}>
              {generateGridImage(i)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default WeaponRep
