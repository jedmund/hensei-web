import React from 'react'
import { useTranslations } from 'next-intl'
import SummonUnit from '~components/summon/SummonUnit'
import { SearchableObject } from '~types'
import styles from './index.module.scss'

// Props
interface Props {
  grid: GridArray<GridSummon>
  editable: boolean
  exists: boolean
  found?: boolean
  offset: number
  removeSummon: (id: string) => void
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
  updateTranscendence: (id: string, position: number, stage: number) => void
}

const ExtraSummonsGrid = (props: Props) => {
  const numSummons: number = 2

  const t = useTranslations('common')

  return (
    <div className={styles.container}>
      <h3>{t('summons.subaura')}</h3>
      <ul className={styles.grid}>
        {Array.from(Array(numSummons)).map((x, i) => {
          return (
            <li key={`grid_unit_${i}`}>
              <SummonUnit
                editable={props.editable}
                position={props.offset + i}
                unitType={1}
                removeSummon={props.removeSummon}
                gridSummon={props.grid[props.offset + i]}
                updateObject={props.updateObject}
                updateUncap={props.updateUncap}
                updateTranscendence={props.updateTranscendence}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ExtraSummonsGrid
