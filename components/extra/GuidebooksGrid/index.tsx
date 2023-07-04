import React from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import GuidebookUnit from '../GuidebookUnit'

import type { SearchableObject } from '~types'

import styles from './index.module.scss'

// Props
interface Props {
  grid: GuidebookList
  editable: boolean
  removeGuidebook: (position: number) => void
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

  const classes = classNames({
    [styles.guidebooks]: true,
    [styles.containerItem]: true,
  })

  const guidebooks = (
    <ul className={styles.grid}>
      {Array.from(Array(EXTRA_WEAPONS_COUNT)).map((x, i) => {
        const itemClasses = classNames({
          Empty: grid && grid[i] === undefined,
        })

        return (
          <li className={itemClasses} key={`grid_unit_${i}`}>
            <GuidebookUnit
              editable={editable}
              position={i + 1}
              guidebook={grid[i + 1]}
              removeGuidebook={removeGuidebook}
              updateObject={updateObject}
            />
          </li>
        )
      })}
    </ul>
  )

  const guidebookElement = <div className={classes}>{guidebooks}</div>

  return guidebookElement
}

export default GuidebooksGrid
