import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'

import cloneDeep from 'lodash.clonedeep'

import SearchFilter from '~components/search/SearchFilter'
import SearchFilterCheckboxItem from '~components/search/SearchFilterCheckboxItem'

import styles from './index.module.scss'
import { emptyElementState, emptyRarityState } from '~utils/emptyStates'
import { elements, rarities } from '~utils/stateValues'

interface Props {
  sendFilters: (filters: { [key: string]: number[] }) => void
}

const SummonSearchFilterBar = (props: Props) => {
  const { t } = useTranslation('common')

  const [rarityMenu, setRarityMenu] = useState(false)
  const [elementMenu, setElementMenu] = useState(false)

  const [rarityState, setRarityState] = useState<RarityState>(emptyRarityState)
  const [elementState, setElementState] =
    useState<ElementState>(emptyElementState)

  function rarityMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(true)
      setElementMenu(false)
    } else setRarityMenu(false)
  }

  function elementMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(true)
    } else setElementMenu(false)
  }

  function handleRarityChange(checked: boolean, key: string) {
    let newRarityState = cloneDeep(rarityState)
    newRarityState[key].checked = checked
    setRarityState(newRarityState)
  }

  function handleElementChange(checked: boolean, key: string) {
    let newElementState = cloneDeep(elementState)
    newElementState[key].checked = checked
    setElementState(newElementState)
  }

  function sendFilters() {
    const checkedRarityFilters = Object.values(rarityState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedElementFilters = Object.values(elementState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)

    const filters = {
      rarity: checkedRarityFilters,
      element: checkedElementFilters,
    }

    props.sendFilters(filters)
  }

  useEffect(() => {
    sendFilters()
  }, [rarityState, elementState])

  const rarityFilter = (
    <SearchFilter
      label={t('filters.labels.rarity')}
      display="list"
      numSelected={
        Object.values(rarityState)
          .map((x) => x.checked)
          .filter(Boolean).length
      }
      open={rarityMenu}
      onOpenChange={rarityMenuOpened}
    >
      {Array.from(Array(rarities.length)).map((x, i) => {
        return (
          <SearchFilterCheckboxItem
            key={rarities[i]}
            onCheckedChange={handleRarityChange}
            checked={rarityState[rarities[i]].checked}
            valueKey={rarities[i]}
          >
            {t(`rarities.${rarities[i]}`)}
          </SearchFilterCheckboxItem>
        )
      })}
    </SearchFilter>
  )

  const elementFilter = (
    <SearchFilter
      label={t('filters.labels.element')}
      display="list"
      numSelected={
        Object.values(elementState)
          .map((x) => x.checked)
          .filter(Boolean).length
      }
      open={elementMenu}
      onOpenChange={elementMenuOpened}
    >
      {Array.from(Array(elements.length)).map((x, i) => {
        return (
          <SearchFilterCheckboxItem
            key={elements[i]}
            onCheckedChange={handleElementChange}
            checked={elementState[elements[i]].checked}
            valueKey={elements[i]}
          >
            {t(`elements.${elements[i]}`)}
          </SearchFilterCheckboxItem>
        )
      })}
    </SearchFilter>
  )

  return (
    <div className={styles.filterBar}>
      {rarityFilter}
      {elementFilter}
    </div>
  )
}

export default SummonSearchFilterBar
