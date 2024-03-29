import React, { useState } from 'react'
import { useTranslation } from 'next-i18next'
import Switch from '~components/common/Switch'
import WeaponUnit from '~components/weapon/WeaponUnit'

import type { SearchableObject } from '~types'

import styles from './index.module.scss'
import classNames from 'classnames'

// Props
interface Props {
  grid: GridArray<GridWeapon>
  editable: boolean
  found?: boolean
  offset: number
  removeWeapon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
  updateTranscendence: (id: string, position: number, stage: number) => void
}

// Constants
const EXTRA_WEAPONS_COUNT = 3

const ExtraWeaponsGrid = ({
  grid,
  editable,
  offset,
  removeWeapon,
  updateObject,
  updateUncap,
  updateTranscendence,
}: Props) => {
  return (
    <ul className={styles.grid}>
      {Array.from(Array(EXTRA_WEAPONS_COUNT)).map((x, i) => {
        const itemClasses = classNames({
          [styles.empty]: grid[offset + i] === undefined,
        })

        return (
          <li className={itemClasses} key={`grid_unit_${i}`}>
            <WeaponUnit
              editable={editable}
              position={offset + i}
              unitType={1}
              gridWeapon={grid[offset + i]}
              removeWeapon={removeWeapon}
              updateObject={updateObject}
              updateUncap={updateUncap}
              updateTranscendence={updateTranscendence}
            />
          </li>
        )
      })}
    </ul>
  )
}

export default ExtraWeaponsGrid
