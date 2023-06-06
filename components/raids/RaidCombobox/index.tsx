import { createRef, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'

import { Command, CommandGroup, CommandInput } from 'cmdk'
import Popover from '~components/common/Popover'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import RaidItem from '~components/raids/RaidItem'
import Tooltip from '~components/common/Tooltip'

import api from '~utils/api'
import { appState } from '~utils/appState'

interface Props {
  showAllRaidsOption: boolean
  currentRaid?: Raid
  currentRaidSlug?: string
  defaultRaid?: Raid
  minimal?: boolean
  onChange?: (raid?: Raid) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

import Button from '~components/common/Button'
import ArrowIcon from '~public/icons/Arrow.svg'
import CrossIcon from '~public/icons/Cross.svg'

import './index.scss'

const NUM_SECTIONS = 3

enum Sort {
  ASCENDING,
  DESCENDING,
}

const RaidCombobox = (props: Props) => {
  // Set up router for locale
  const router = useRouter()
  const locale = router.locale || 'en'

  // Set up translations
  const { t } = useTranslation('common')

  // Component state
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState<Sort>(Sort.DESCENDING)
  const [scrolled, setScrolled] = useState(false)

  // Data state
  const [currentSection, setCurrentSection] = useState(1)
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState<RaidGroup[][]>()
  const [currentRaid, setCurrentRaid] = useState<Raid>()

  // Refs
  const listRef = createRef<HTMLDivElement>()

  // ----------------------------------------------
  // Methods: Lifecycle Hooks
  // ----------------------------------------------

  // Fetch all raids on mount
  useEffect(() => {
    api.raidGroups().then((response) => sortGroups(response.data))
  }, [])

  // Set current raid and section when the component mounts
  useEffect(() => {
    if (appState.party.raid) {
      setCurrentRaid(appState.party.raid)
      setCurrentSection(appState.party.raid.group.section)
    }
  }, [])

  // Update current raid when the currentRaidSlug prop changes
  useEffect(() => {
    if (props.currentRaidSlug) {
      setCurrentRaid(slugToRaid(props.currentRaidSlug))
    }
  })

  // Scroll to the top of the list when the user switches tabs
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [currentSection])

  // ----------------------------------------------
  // Methods: Event Handlers
  // ----------------------------------------------

  // Scroll to an item in the list when it is selected
  const scrollToItem = useCallback(
    (node) => {
      if (!scrolled && open && currentRaid && listRef.current && node) {
        const { top: listTop } = listRef.current.getBoundingClientRect()
        const { top: itemTop } = node.getBoundingClientRect()

        listRef.current.scrollTop = itemTop - listTop
        setScrolled(true)
      }
    },
    [scrolled, open, currentRaid, listRef]
  )

  // Reverse the sort order
  function reverseSort() {
    if (sort === Sort.ASCENDING) setSort(Sort.DESCENDING)
    else setSort(Sort.ASCENDING)
  }

  // Sorts the raid groups into sections
  const sortGroups = useCallback(
    (groups: RaidGroup[]) => {
      const sections: [RaidGroup[], RaidGroup[], RaidGroup[]] = [[], [], []]

      groups.forEach((group) => {
        if (group.section > 0) sections[group.section - 1].push(group)
      })

      setSections(sections)
    },
    [setSections]
  )

  // Handle value change for the raid selection
  function handleValueChange(raid: Raid) {
    setCurrentRaid(raid)
    setOpen(false)
    setScrolled(false)
    if (props.onChange) props.onChange(raid)
  }

  // Toggle the open state of the combobox
  function toggleOpen() {
    if (open) {
      if (currentRaid) setCurrentSection(currentRaid.group.section)
      setScrolled(false)
    }
    setOpen(!open)
  }

  // Clear the search query
  function clearSearch() {
    setQuery('')
  }

  // ----------------------------------------------
  // Methods: Rendering
  // ----------------------------------------------

  // Renders each raid section
  function renderRaidSections() {
    return Array.from({ length: NUM_SECTIONS }, (_, i) => renderRaidSection(i))
  }

  // Renders the specified raid section
  function renderRaidSection(section: number) {
    const currentSection = sections?.[section]
    if (!currentSection) return

    const sortedGroups = currentSection.sort((a, b) => {
      return sort === Sort.ASCENDING ? a.order - b.order : b.order - a.order
    })

    return sortedGroups.map((group, i) => renderRaidGroup(section, i))
  }

  // Renders the specified raid group
  function renderRaidGroup(section: number, index: number) {
    if (!sections?.[section]?.[index]) return

    const group = sections[section][index]
    const options = generateRaidItems(group.raids)

    const groupClassName = classNames({
      CommandGroup: true,
      Hidden: group.section !== currentSection,
    })

    const heading = (
      <div className="Label">
        {group.name[locale]}
        <div className="Separator" />
      </div>
    )

    return (
      <CommandGroup
        data-section={group.section}
        className={groupClassName}
        key={group.name[locale].toLowerCase().replace(' ', '-')}
        heading={heading}
      >
        {options}
      </CommandGroup>
    )
  }

  // Generates a list of RaidItem components from the specified raids
  function generateRaidItems(raids: Raid[]) {
    return raids
      .sort((a, b) => {
        if (a.element > 0 && b.element > 0) return a.element - b.element
        if (a.name.en.includes('NM') && b.name.en.includes('NM'))
          return a.level - b.level
        return a.name.en.localeCompare(b.name.en)
      })
      .map((item, i) => renderRaidItem(item, i))
  }

  // Renders a RaidItem component for the specified raid
  function renderRaidItem(raid: Raid, key: number) {
    const isSelected = currentRaid?.id === raid.id
    const isRef = isSelected ? scrollToItem : undefined
    const imageUrl = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/raids/${raid.slug}.png`

    return (
      <RaidItem
        className={isSelected ? 'Selected' : ''}
        icon={{ alt: raid.name[locale], src: imageUrl }}
        extra={raid.group.extra}
        key={key}
        selected={isSelected}
        ref={isRef}
        value={raid.slug}
        onSelect={() => handleValueChange(raid)}
      >
        {raid.name[locale]}
      </RaidItem>
    )
  }

  // Renders a SegmentedControl component for selecting raid sections.
  function renderSegmentedControl() {
    return (
      <SegmentedControl blended={true}>
        <Segment
          groupName="raid_section"
          name="events"
          selected={currentSection === 2}
          onClick={() => setCurrentSection(2)}
        >
          {t('raids.sections.events')}
        </Segment>
        <Segment
          groupName="raid_section"
          name="raids"
          selected={currentSection === 1}
          onClick={() => setCurrentSection(1)}
        >
          {t('raids.sections.raids')}
        </Segment>
        <Segment
          groupName="raid_section"
          name="solo"
          selected={currentSection === 3}
          onClick={() => setCurrentSection(3)}
        >
          {t('raids.sections.solo')}
        </Segment>
      </SegmentedControl>
    )
  }

  // Renders a Button for sorting raids and a Tooltip for explaining what it does.

  function renderSortButton() {
    return (
      <Tooltip
        content={
          sort === Sort.ASCENDING
            ? 'Lower difficulty battles first'
            : 'Higher difficulty battles first'
        }
      >
        <Button
          blended={true}
          buttonSize="small"
          leftAccessoryIcon={<ArrowIcon />}
          leftAccessoryClassName={sort === Sort.DESCENDING ? 'Flipped' : ''}
          onClick={reverseSort}
        />
      </Tooltip>
    )
  }

  // Renders the content for the Popover trigger.
  function renderTriggerContent() {
    if (currentRaid) {
      const element = (
        <>
          {!props.minimal && (
            <div className="Info">
              <span className="Group">{currentRaid.group.name[locale]}</span>
              <span className="Separator">/</span>
              <span className={classNames({ Raid: true }, linkClass)}>
                {currentRaid.name[locale]}
              </span>
            </div>
          )}

          {currentRaid.group.extra && !props.minimal && (
            <i className="ExtraIndicator">EX</i>
          )}
        </>
      )

      return {
        element,
        rawValue: currentRaid.id,
      }
    }

    return undefined
  }

  // Renders the search input for the raid combobox
  function renderSearchInput() {
    return (
      <div className="Bound Joined">
        <CommandInput
          className="Input"
          placeholder={t('search.placeholders.raid')}
          value={query}
          onValueChange={setQuery}
        />
        <div
          className={classNames({
            Button: true,
            Clear: true,
            Visible: query.length > 0,
          })}
          onClick={clearSearch}
        >
          <CrossIcon />
        </div>
      </div>
    )
  }

  // ----------------------------------------------
  // Methods: Utility
  // ----------------------------------------------
  function slugToRaid(slug: string) {
    return appState.raidGroups
      .filter((group) => group.section > 0)
      .flatMap((group) => group.raids)
      .find((raid) => raid.slug === slug)
  }

  const linkClass = classNames({
    wind: currentRaid && currentRaid.element == 1,
    fire: currentRaid && currentRaid.element == 2,
    water: currentRaid && currentRaid.element == 3,
    earth: currentRaid && currentRaid.element == 4,
    dark: currentRaid && currentRaid.element == 5,
    light: currentRaid && currentRaid.element == 6,
  })

  // ----------------------------------------------
  // Render
  // ----------------------------------------------
  return (
    <Popover
      className="Flush"
      open={open}
      onOpenChange={toggleOpen}
      placeholder={t('raids.placeholder')}
      trigger={{ className: 'Raid' }}
      value={renderTriggerContent()}
    >
      <Command className="Raid Combobox">
        <div className="Header">
          {renderSearchInput()}
          {!query && (
            <div className="Controls">
              {renderSegmentedControl()}
              {renderSortButton()}
            </div>
          )}
        </div>
        <div
          className={classNames({ Raids: true, Searching: query !== '' })}
          ref={listRef}
        >
          {renderRaidSections()}
        </div>
      </Command>
    </Popover>
  )
}

RaidCombobox.defaultProps = {
  minimal: false,
}

export default RaidCombobox
