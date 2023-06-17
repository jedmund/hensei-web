import React, { useState } from 'react'
import { useTranslation } from 'next-i18next'
import Switch from '~components/common/Switch'
import WeaponUnit from '~components/weapon/WeaponUnit'

import type { SearchableObject } from '~types'

import './index.scss'
import classNames from 'classnames'

// Props
interface Props {
  grid: GridArray<GridWeapon>
  enabled: boolean
  editable: boolean
  found?: boolean
  offset: number
  removeWeapon: (id: string) => void
  updateExtra: (enabled: boolean) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
}

// Constants
const EXTRA_WEAPONS_COUNT = 3

const ExtraWeaponsGrid = ({
  grid,
  enabled,
  editable,
  found,
  offset,
  removeWeapon,
  updateExtra,
  updateObject,
  updateUncap,
}: Props) => {
  const { t } = useTranslation('common')

  const classes = classNames({
    ExtraWeapons: true,
    ContainerItem: true,
    Disabled: !enabled,
  })

  function onCheckedChange(checked: boolean) {
    updateExtra(checked)
  }

  const disabledElement = <></>

  const enabledElement = (
    <ul id="ExtraWeaponGrid">
      {Array.from(Array(EXTRA_WEAPONS_COUNT)).map((x, i) => {
        const itemClasses = classNames({
          Empty: grid[offset + i] === undefined,
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
            />
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className={classes}>
      <div className="Header">
        <h3>{t('extra_weapons')}</h3>
        {editable ? (
          <Switch
            name="ExtraWeapons"
            checked={enabled}
            onCheckedChange={onCheckedChange}
          />
        ) : (
          ''
        )}
      </div>
      {enabled ? enabledElement : ''}
    </div>
  )
}

export default ExtraWeaponsGrid
