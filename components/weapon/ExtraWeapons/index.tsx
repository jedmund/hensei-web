import React from 'react'
import { useTranslation } from 'next-i18next'
import WeaponUnit from '~components/weapon/WeaponUnit'

import type { SearchableObject } from '~types'

import './index.scss'

// Props
interface Props {
  grid: GridArray<GridWeapon>
  editable: boolean
  found?: boolean
  offset: number
  removeWeapon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
}

const ExtraWeapons = (props: Props) => {
  const numWeapons: number = 3
  const { t } = useTranslation('common')

  return (
    <div className="ExtraGrid Weapons">
      <span>{t('extra_weapons')}</span>
      <ul id="ExtraWeapons">
        {Array.from(Array(numWeapons)).map((x, i) => {
          return (
            <li key={`grid_unit_${i}`}>
              <WeaponUnit
                editable={props.editable}
                position={props.offset + i}
                unitType={1}
                gridWeapon={props.grid[props.offset + i]}
                removeWeapon={props.removeWeapon}
                updateObject={props.updateObject}
                updateUncap={props.updateUncap}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ExtraWeapons
