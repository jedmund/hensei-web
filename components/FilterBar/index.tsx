import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import equals from 'fast-deep-equal'

import FilterModal from '~components/FilterModal'
import RaidDropdown from '~components/RaidDropdown'
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'
import Button from '~components/Button'

import { defaultFilterset } from '~utils/defaultFilters'

import FilterIcon from '~public/icons/Filter.svg'

import './index.scss'

interface Props {
  children: React.ReactNode
  scrolled: boolean
  element?: number
  raidSlug?: string
  recency?: number
  onFilter: (filters: FilterSet) => void
}

const FilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [recencyOpen, setRecencyOpen] = useState(false)
  const [elementOpen, setElementOpen] = useState(false)

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterSet>({})

  const [matchesDefaultFilters, setMatchesDefaultFilters] = useState(false)
  // Set up classes object for showing shadow on scroll
  const classes = classNames({
    FilterBar: true,
    shadow: props.scrolled,
  })

  const filterButtonClasses = classNames({
    Filter: true,
    FiltersActive: !matchesDefaultFilters,
  })

  useEffect(() => {
    // Fetch user's advanced filters
    const filtersCookie = getCookie('filters')
    if (filtersCookie) setAdvancedFilters(JSON.parse(filtersCookie as string))
    else setAdvancedFilters(defaultFilterset)
  }, [])

  useEffect(() => {
    setMatchesDefaultFilters(equals(advancedFilters, defaultFilterset))
  }, [advancedFilters, defaultFilterset])

  function openElementSelect() {
    setElementOpen(!elementOpen)
  }

  function openRecencySelect() {
    setRecencyOpen(!recencyOpen)
  }

  function elementSelectChanged(value: string) {
    const elementValue = parseInt(value)
    props.onFilter({ element: elementValue, ...advancedFilters })
  }

  function recencySelectChanged(value: string) {
    const recencyValue = parseInt(value)
    props.onFilter({ recency: recencyValue, ...advancedFilters })
  }

  function raidSelectChanged(slug?: string) {
    props.onFilter({ raidSlug: slug, ...advancedFilters })
  }

  function handleAdvancedFiltersChanged(filters: FilterSet) {
    setAdvancedFilters(filters)
    props.onFilter(filters)
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
        defaultFilterSet={defaultFilterset}
        filterSet={advancedFilters}
        open={filterModalOpen}
      <FilterModal open={filterModalOpen} onOpenChange={setFilterModalOpen} />
        sendAdvancedFilters={handleAdvancedFiltersChanged}
      />
    </>
  )
}

export default FilterBar
