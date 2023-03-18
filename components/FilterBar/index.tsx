import React, { useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import FilterModal from '~components/FilterModal'
import RaidDropdown from '~components/RaidDropdown'
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'
import Button from '~components/Button'

import FilterIcon from '~public/icons/Filter.svg'

import './index.scss'
import { getCookie } from 'cookies-next'

interface Props {
  children: React.ReactNode
  scrolled: boolean
  element?: number
  raidSlug?: string
  recency?: number
  onFilter: ({
    element,
    raidSlug,
    recency,
  }: {
    element?: number
    raidSlug?: string
    recency?: number
  }) => void
}

const DEFAULT_FULL_AUTO = false
const DEFAULT_AUTO_GUARD = false
const DEFAULT_CHARGE_ATTACK = false
const DEFAULT_MAX_BUTTONS = 0
const DEFAULT_MAX_TURNS = 0
const DEFAULT_MIN_CHARACTERS = 3
const DEFAULT_MIN_WEAPONS = 5
const DEFAULT_MIN_SUMMONS = 2
const DEFAULT_NAME_QUALITY = false
const DEFAULT_USER_QUALITY = false
const DEFAULT_ORIGINAL_ONLY = false

const DEFAULT_FILTERSET: FilterSet = {
  full_auto: DEFAULT_FULL_AUTO,
  auto_guard: DEFAULT_AUTO_GUARD,
  charge_attack: DEFAULT_CHARGE_ATTACK,
  characters_count: DEFAULT_MIN_CHARACTERS,
  weapons_count: DEFAULT_MIN_WEAPONS,
  summons_count: DEFAULT_MIN_SUMMONS,
  button_count: DEFAULT_MAX_BUTTONS,
  turn_count: DEFAULT_MAX_TURNS,
  name_quality: DEFAULT_NAME_QUALITY,
  user_quality: DEFAULT_USER_QUALITY,
  original: DEFAULT_ORIGINAL_ONLY,
}

const FilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [recencyOpen, setRecencyOpen] = useState(false)
  const [elementOpen, setElementOpen] = useState(false)

  const [filterModalOpen, setFilterModalOpen] = useState(false)

  // Fetch user's advanced filters
  const filtersCookie = getCookie('filters')
  const advancedFilters: FilterSet = filtersCookie
    ? JSON.parse(filtersCookie as string)
    : DEFAULT_FILTERSET

  // Set up classes object for showing shadow on scroll
  const classes = classNames({
    FilterBar: true,
    shadow: props.scrolled,
  })

  function openElementSelect() {
    setElementOpen(!elementOpen)
  }

  function openRecencySelect() {
    setRecencyOpen(!recencyOpen)
  }

  function elementSelectChanged(value: string) {
    const elementValue = parseInt(value)
    props.onFilter({ element: elementValue })
  }

  function recencySelectChanged(value: string) {
    const recencyValue = parseInt(value)
    props.onFilter({ recency: recencyValue })
  }

  function raidSelectChanged(slug?: string) {
    props.onFilter({ raidSlug: slug })
  }

  function onSelectChange(name: 'element' | 'recency') {
    setElementOpen(name === 'element' ? !elementOpen : false)
    setRecencyOpen(name === 'recency' ? !recencyOpen : false)
  }

  return (
    <>
      <div className={classes}>
        {props.children}
        <div className="Filters">
          <Select
            value={`${props.element}`}
            open={elementOpen}
            onOpenChange={() => onSelectChange('element')}
            onValueChange={elementSelectChanged}
            onClick={openElementSelect}
          >
            <SelectItem data-element="all" key={-1} value={-1}>
              {t('elements.full.all')}
            </SelectItem>
            <SelectItem data-element="null" key={0} value={0}>
              {t('elements.full.null')}
            </SelectItem>
            <SelectItem data-element="wind" key={1} value={1}>
              {t('elements.full.wind')}
            </SelectItem>
            <SelectItem data-element="fire" key={2} value={2}>
              {t('elements.full.fire')}
            </SelectItem>
            <SelectItem data-element="water" key={3} value={3}>
              {t('elements.full.water')}
            </SelectItem>
            <SelectItem data-element="earth" key={4} value={4}>
              {t('elements.full.earth')}
            </SelectItem>
            <SelectItem data-element="dark" key={5} value={5}>
              {t('elements.full.dark')}
            </SelectItem>
            <SelectItem data-element="light" key={6} value={6}>
              {t('elements.full.light')}
            </SelectItem>
          </Select>

          <RaidDropdown
            currentRaid={props.raidSlug}
            defaultRaid="all"
            showAllRaidsOption={true}
            onChange={raidSelectChanged}
          />

          <Select
            value={`${props.recency}`}
            trigger={'All time'}
            open={recencyOpen}
            onOpenChange={() => onSelectChange('recency')}
            onValueChange={recencySelectChanged}
            onClick={openRecencySelect}
          >
            <SelectItem key={-1} value={-1}>
              {t('recency.all_time')}
            </SelectItem>
            <SelectItem key={86400} value={86400}>
              {t('recency.last_day')}
            </SelectItem>
            <SelectItem key={604800} value={604800}>
              {t('recency.last_week')}
            </SelectItem>
            <SelectItem key={2629746} value={2629746}>
              {t('recency.last_month')}
            </SelectItem>
            <SelectItem key={7889238} value={7889238}>
              {t('recency.last_3_months')}
            </SelectItem>
            <SelectItem key={15778476} value={15778476}>
              {t('recency.last_6_months')}
            </SelectItem>
            <SelectItem key={31556952} value={31556952}>
              {t('recency.last_year')}
            </SelectItem>
          </Select>

          <Button
            className="Filter"
            blended={true}
            leftAccessoryIcon={<FilterIcon />}
            onClick={() => setFilterModalOpen(true)}
          />
        </div>
      </div>
      <FilterModal
        defaultFilterSet={DEFAULT_FILTERSET}
        filterSet={advancedFilters}
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
      />
    </>
  )
}

export default FilterBar
