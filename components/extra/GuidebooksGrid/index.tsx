import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import Switch from '~components/common/Switch'
import GuidebookUnit from '../GuidebookUnit'
import classNames from 'classnames'

import type { SearchableObject } from '~types'

import './index.scss'

// Props
interface Props {
  grid: GuidebookList
  editable: boolean
  offset: number
  removeGuidebook: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
}

// Constants
const EXTRA_WEAPONS_COUNT = 3

const GuidebooksGrid = ({
  grid,
  editable,
  removeGuidebook,
  updateObject,
}: Props) => {
  const { t } = useTranslation('common')

  const [enabled, setEnabled] = useState(false)

  const classes = classNames({
    Guidebooks: true,
    ContainerItem: true,
    Disabled: !enabled,
  })

  useEffect(() => {
    console.log('Grid updated')
    if (hasGuidebooks()) setEnabled(true)
  }, [grid])

  function hasGuidebooks() {
    return grid && (grid[0] || grid[1] || grid[2])
  }

  function onCheckedChange(checked: boolean) {
    setEnabled(checked)
  }

  const enabledElement = (
    <ul id="GuidebooksGrid">
      {Array.from(Array(EXTRA_WEAPONS_COUNT)).map((x, i) => {
        const itemClasses = classNames({
          Empty: grid && grid[i] === undefined,
        })

        return (
          <li className={itemClasses} key={`grid_unit_${i}`}>
            <GuidebookUnit
              editable={editable}
              position={i}
              guidebook={grid[i]}
              removeGuidebook={removeGuidebook}
              updateObject={updateObject}
            />
          </li>
        )
      })}
    </ul>
  )

  const guidebookElement = (
    <div className={classes}>
      <div className="Header">
        <h3>{t('sephira_guidebooks')}</h3>
        {editable ? (
          <Switch
            name="Guidebooks"
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

  return editable || (enabled && !editable) ? guidebookElement : <div />
}

export default GuidebooksGrid
