import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import cloneDeep from 'lodash.clonedeep'

import SearchFilter from '~components/search/SearchFilter'
import SearchFilterCheckboxItem from '~components/search/SearchFilterCheckboxItem'

import styles from './index.module.scss'
import {
  emptyElementState,
  emptyProficiencyState,
  emptyRarityState,
  emptyWeaponSeriesState,
} from '~utils/emptyStates'
import { elements, proficiencies, rarities } from '~utils/stateValues'
import { weaponSeries } from '~data/weaponSeries'

interface Props {
  sendFilters: (filters: { [key: string]: number[] }) => void
}

const WeaponSearchFilterBar = (props: Props) => {
  const t = useTranslations('common')

  const [rarityMenu, setRarityMenu] = useState(false)
  const [elementMenu, setElementMenu] = useState(false)
  const [proficiencyMenu, setProficiencyMenu] = useState(false)
  const [seriesMenu, setSeriesMenu] = useState(false)

  const [rarityState, setRarityState] = useState<RarityState>(emptyRarityState)
  const [elementState, setElementState] =
    useState<ElementState>(emptyElementState)
  const [proficiencyState, setProficiencyState] = useState<ProficiencyState>(
    emptyProficiencyState
  )
  const [seriesState, setSeriesState] = useState<WeaponSeriesState>(
    emptyWeaponSeriesState
  )

  useEffect(() => {
    sendFilters()
  }, [rarityState, elementState, proficiencyState, seriesState])

  function rarityMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(true)
      setElementMenu(false)
      setProficiencyMenu(false)
      setSeriesMenu(false)
    } else setRarityMenu(false)
  }

  function elementMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(true)
      setProficiencyMenu(false)
      setSeriesMenu(false)
    } else setElementMenu(false)
  }

  function proficiencyMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(false)
      setProficiencyMenu(true)
      setSeriesMenu(false)
    } else setProficiencyMenu(false)
  }

  function seriesMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(false)
      setProficiencyMenu(false)
      setSeriesMenu(true)
    } else setSeriesMenu(false)
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

  function handleProficiencyChange(checked: boolean, key: string) {
    let newProficiencyState = cloneDeep(proficiencyState)
    newProficiencyState[key].checked = checked
    setProficiencyState(newProficiencyState)
  }

  function handleSeriesChange(checked: boolean, key: string) {
    let newSeriesState = cloneDeep(seriesState)
    newSeriesState[key].checked = checked
    setSeriesState(newSeriesState)
  }

  function sendFilters() {
    const checkedRarityFilters = Object.values(rarityState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedElementFilters = Object.values(elementState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedProficiencyFilters = Object.values(proficiencyState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedSeriesFilters = Object.values(seriesState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)

    const filters = {
      rarity: checkedRarityFilters,
      element: checkedElementFilters,
      proficiency1: checkedProficiencyFilters,
      series: checkedSeriesFilters,
    }

    props.sendFilters(filters)
  }

  const renderProficiencies = () => {
    return (
      <>
        {proficiencies.map((x, i) => {
          return (
            <SearchFilterCheckboxItem
              key={x}
              onCheckedChange={handleProficiencyChange}
              checked={proficiencyState[x].checked}
              valueKey={x}
            >
              {t(`proficiencies.${x}`)}
            </SearchFilterCheckboxItem>
          )
        })}
      </>
    )
  }

  const renderWeaponSeries = () => {
    return (
      <>
        {weaponSeries.map((x, i) => {
          return (
            <SearchFilterCheckboxItem
              key={x.slug}
              onCheckedChange={handleSeriesChange}
              checked={seriesState[x.slug].checked}
              valueKey={x.slug}
            >
              {t(`series.${x.slug}`)}
            </SearchFilterCheckboxItem>
          )
        })}
      </>
    )
  }

  const rarityFilter = (
    <SearchFilter
      label={t('filters.labels.rarity')}
      key="rarity"
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
      key="element"
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

  const proficiencyFilter = (
    <SearchFilter
      label={t('filters.labels.proficiency')}
      key="proficiency"
      display="grid"
      numSelected={
        Object.values(proficiencyState)
          .map((x) => x.checked)
          .filter(Boolean).length
      }
      open={proficiencyMenu}
      onOpenChange={proficiencyMenuOpened}
    >
      {renderProficiencies()}
    </SearchFilter>
  )

  const seriesFilter = (
    <SearchFilter
      label={t('filters.labels.series')}
      key="series"
      display="grid"
      numSelected={
        Object.values(seriesState)
          .map((x) => x.checked)
          .filter(Boolean).length
      }
      open={seriesMenu}
      onOpenChange={seriesMenuOpened}
    >
      {renderWeaponSeries()}
    </SearchFilter>
  )

  return (
    <section className={styles.filterBar}>
      {rarityFilter}
      {elementFilter}
      {proficiencyFilter}
      {seriesFilter}
    </section>
  )
}

export default WeaponSearchFilterBar
