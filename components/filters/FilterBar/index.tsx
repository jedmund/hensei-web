import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { getCookie } from 'cookies-next'
import classNames from 'classnames'
import equals from 'fast-deep-equal'

import FilterModal from '~components/filters/FilterModal'
import RaidCombobox from '~components/raids/RaidCombobox'
import Select from '~components/common/Select'
import SelectItem from '~components/common/SelectItem'
import Button from '~components/common/Button'

import { appState } from '~utils/appState'

import FilterIcon from '~public/icons/Filter.svg'
import styles from './index.module.scss'

interface Props {
  defaultFilterset: FilterSet
  persistFilters?: boolean
  children: React.ReactNode
  element?: number
  raid?: string
  raidGroups: RaidGroup[]
  recency?: number
  onFilter: (filters: FilterSet) => void
  onAdvancedFilter: (filters: FilterSet) => void
}

const FilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [scrolled, setScrolled] = useState(false)

  const [currentRaid, setCurrentRaid] = useState<Raid>()

  const [recencyOpen, setRecencyOpen] = useState(false)
  const [elementOpen, setElementOpen] = useState(false)

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterSet>({})

  const [matchesDefaultFilters, setMatchesDefaultFilters] = useState(false)
  // Set up classes object for showing shadow on scroll
  const classes = classNames({
    [styles.filterBar]: true,
    [styles.shadow]: scrolled,
  })

  const filterButtonClasses = classNames({
    filter: true,
    filtersActive: !matchesDefaultFilters,
  })

  // Add scroll event listener for shadow on FilterBar on mount
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleScroll() {
    if (window.scrollY > 90) setScrolled(true)
    else setScrolled(false)
  }

  // Convert raid slug to Raid object on mount
  useEffect(() => {
    const raid = appState.raidGroups
      .filter((group) => group.section > 0)
      .flatMap((group) => group.raids)
      .find((raid) => raid.id === props.raid)

    setCurrentRaid(raid)
  }, [props.raid])

  useEffect(() => {
    // Fetch user's advanced filters
    const filtersCookie = getCookie('filters')
    if (filtersCookie && props.persistFilters) {
      setAdvancedFilters(JSON.parse(filtersCookie as string))
    } else setAdvancedFilters(props.defaultFilterset)
  }, [])

  useEffect(() => {
    setMatchesDefaultFilters(equals(advancedFilters, props.defaultFilterset))
  }, [advancedFilters, props.defaultFilterset])

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

  function raidSelectChanged(raid?: Raid) {
    props.onFilter({ raid: raid?.slug, ...advancedFilters })
  }

  function handleAdvancedFiltersChanged(filters: FilterSet) {
    setAdvancedFilters(filters)
    props.onAdvancedFilter(filters)
  }

  function onSelectChange(name: 'element' | 'recency') {
    setElementOpen(name === 'element' ? !elementOpen : false)
    setRecencyOpen(name === 'recency' ? !recencyOpen : false)
  }

  function generateSelectItems() {
    const elements = [
      { element: 'all', key: -1, value: -1, text: t('elements.full.all') },
      { element: 'null', key: 0, value: 0, text: t('elements.full.null') },
      { element: 'wind', key: 1, value: 1, text: t('elements.full.wind') },
      { element: 'fire', key: 2, value: 2, text: t('elements.full.fire') },
      { element: 'water', key: 3, value: 3, text: t('elements.full.water') },
      { element: 'earth', key: 4, value: 4, text: t('elements.full.earth') },
      { element: 'dark', key: 5, value: 5, text: t('elements.full.dark') },
      { element: 'light', key: 6, value: 6, text: t('elements.full.light') },
    ]

    return elements.map(({ element, key, value, text }) => (
      <SelectItem data-element={element} key={key} value={value}>
        {text}
      </SelectItem>
    ))
  }

  return (
    <>
      <div className={classes}>
        {props.children}
        <div className={styles.filters}>
          <Select
            value={`${props.element}`}
            trigger={{
              bound: true,
              size: 'small',
            }}
            overlayVisible={false}
            open={elementOpen}
            onOpenChange={() => onSelectChange('element')}
            onValueChange={elementSelectChanged}
            onClick={openElementSelect}
          >
            {generateSelectItems()}
          </Select>

          <RaidCombobox
            currentRaid={currentRaid}
            showAllRaidsOption={true}
            raidGroups={props.raidGroups}
            minimal={true}
            size="small"
            onChange={raidSelectChanged}
          />

          <Select
            value={`${props.recency}`}
            trigger={{
              bound: true,
              size: 'small',
            }}
            overlayVisible={false}
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
            className={filterButtonClasses}
            blended={true}
            leftAccessoryIcon={<FilterIcon />}
            text={t('filters.name')}
            size="small"
            onClick={() => setFilterModalOpen(true)}
          />
        </div>
      </div>

      <FilterModal
        defaultFilterSet={props.defaultFilterset}
        filterSet={advancedFilters}
        persistFilters={props.persistFilters}
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        sendAdvancedFilters={handleAdvancedFiltersChanged}
      />
    </>
  )
}

FilterBar.defaultProps = {
  persistFilters: true,
}

export default FilterBar
