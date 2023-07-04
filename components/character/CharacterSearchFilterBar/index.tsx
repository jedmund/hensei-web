import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import cloneDeep from 'lodash.clonedeep'

import SearchFilter from '~components/search/SearchFilter'
import SearchFilterCheckboxItem from '~components/search/SearchFilterCheckboxItem'

import {
  emptyElementState,
  emptyProficiencyState,
  emptyRarityState,
} from '~utils/emptyStates'
import { elements, proficiencies, rarities } from '~utils/stateValues'

import styles from './index.module.scss'

interface Props {
  sendFilters: (filters: { [key: string]: number[] }) => void
}

const CharacterSearchFilterBar = (props: Props) => {
  const { t } = useTranslation('common')

  const [rarityMenu, setRarityMenu] = useState(false)
  const [elementMenu, setElementMenu] = useState(false)
  const [proficiency1Menu, setProficiency1Menu] = useState(false)
  const [proficiency2Menu, setProficiency2Menu] = useState(false)

  const [rarityState, setRarityState] = useState<RarityState>(emptyRarityState)
  const [elementState, setElementState] =
    useState<ElementState>(emptyElementState)
  const [proficiency1State, setProficiency1State] = useState<ProficiencyState>(
    emptyProficiencyState
  )
  const [proficiency2State, setProficiency2State] = useState<ProficiencyState>(
    emptyProficiencyState
  )

  function rarityMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(true)
      setElementMenu(false)
      setProficiency1Menu(false)
      setProficiency2Menu(false)
    } else setRarityMenu(false)
  }

  function elementMenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(true)
      setProficiency1Menu(false)
      setProficiency2Menu(false)
    } else setElementMenu(false)
  }

  function proficiency1MenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(false)
      setProficiency1Menu(true)
      setProficiency2Menu(false)
    } else setProficiency1Menu(false)
  }

  function proficiency2MenuOpened(open: boolean) {
    if (open) {
      setRarityMenu(false)
      setElementMenu(false)
      setProficiency1Menu(false)
      setProficiency2Menu(true)
    } else setProficiency2Menu(false)
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

  function handleProficiency1Change(checked: boolean, key: string) {
    let newProficiencyState = cloneDeep(proficiency1State)
    newProficiencyState[key].checked = checked
    setProficiency1State(newProficiencyState)
  }

  function handleProficiency2Change(checked: boolean, key: string) {
    let newProficiencyState = cloneDeep(proficiency2State)
    newProficiencyState[key].checked = checked
    setProficiency2State(newProficiencyState)
  }

  function sendFilters() {
    const checkedRarityFilters = Object.values(rarityState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedElementFilters = Object.values(elementState)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedProficiency1Filters = Object.values(proficiency1State)
      .filter((x) => x.checked)
      .map((x, i) => x.id)
    const checkedProficiency2Filters = Object.values(proficiency2State)
      .filter((x) => x.checked)
      .map((x, i) => x.id)

    const filters = {
      rarity: checkedRarityFilters,
      element: checkedElementFilters,
      proficiency1: checkedProficiency1Filters,
      proficiency2: checkedProficiency2Filters,
    }

    props.sendFilters(filters)
  }

  useEffect(() => {
    sendFilters()
  }, [rarityState, elementState, proficiency1State, proficiency2State])

  function renderProficiencyFilter(proficiency: 1 | 2) {
    const onCheckedChange =
      proficiency == 1 ? handleProficiency1Change : handleProficiency2Change
    const numSelected =
      proficiency == 1
        ? Object.values(proficiency1State)
            .map((x) => x.checked)
            .filter(Boolean).length
        : Object.values(proficiency2State)
            .map((x) => x.checked)
            .filter(Boolean).length
    const open = proficiency == 1 ? proficiency1Menu : proficiency2Menu
    const onOpenChange =
      proficiency == 1 ? proficiency1MenuOpened : proficiency2MenuOpened

    return (
      <SearchFilter
        label={`${t('filters.labels.proficiency')} ${proficiency}`}
        display="grid"
        numSelected={numSelected}
        open={open}
        onOpenChange={onOpenChange}
      >
        {Array.from(Array(proficiencies.length)).map((x, i) => {
          const checked =
            proficiency == 1
              ? proficiency1State[proficiencies[i]].checked
              : proficiency2State[proficiencies[i]].checked

          return (
            <SearchFilterCheckboxItem
              key={proficiencies[i]}
              onCheckedChange={onCheckedChange}
              checked={checked}
              valueKey={proficiencies[i]}
            >
              {t(`proficiencies.${proficiencies[i]}`)}
            </SearchFilterCheckboxItem>
          )
        })}
      </SearchFilter>
    )
  }

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
      {renderProficiencyFilter(1)}
      {renderProficiencyFilter(2)}
    </div>
  )
}

export default CharacterSearchFilterBar
