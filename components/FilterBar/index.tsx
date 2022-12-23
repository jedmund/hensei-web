import React, { useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import RaidDropdown from '~components/RaidDropdown'

import './index.scss'
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

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

const FilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [recencyOpen, setRecencyOpen] = useState(false)
  const [elementOpen, setElementOpen] = useState(false)

  // Set up refs for filter dropdowns
  const elementSelect = React.createRef<HTMLSelectElement>()
  const raidSelect = React.createRef<HTMLSelectElement>()
  const recencySelect = React.createRef<HTMLSelectElement>()

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

  return (
    <div className={classes}>
      {props.children}
      <Select
        defaultValue={`${props.element}`}
        open={elementOpen}
        onChange={elementSelectChanged}
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
        ref={raidSelect}
      />

      <Select
        defaultValue={`${props.recency}`}
        trigger={'All time'}
        open={recencyOpen}
        onChange={recencySelectChanged}
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
    </div>
  )
}

export default FilterBar
