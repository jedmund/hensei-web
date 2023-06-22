import { createRef, useCallback, useEffect, useState, useRef } from 'react'
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
  defaultRaid?: Raid
  minimal?: boolean
  tabIndex?: number
  onChange?: (raid?: Raid) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

import Button from '~components/common/Button'
import ArrowIcon from '~public/icons/Arrow.svg'
import CrossIcon from '~public/icons/Cross.svg'

import './index.scss'

const NUM_SECTIONS = 3
const NUM_ELEMENTS = 5

enum Sort {
  ASCENDING,
  DESCENDING,
}

// Set up empty raid for "All raids"
const untitledGroup: RaidGroup = {
  id: '0',
  name: {
    en: '',
    ja: '',
  },
  section: 0,
  order: 0,
  extra: false,
  guidebooks: false,
  raids: [],
  difficulty: 0,
  hl: false,
}

// Set up empty raid for "All raids"
const allRaidsOption: Raid = {
  id: '0',
  name: {
    en: 'All battles',
    ja: '全てのバトル',
  },
  group: untitledGroup,
  slug: 'all',
  level: 0,
  element: 0,
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
  const [tabIndex, setTabIndex] = useState(NUM_ELEMENTS + 1)

  // Data
  const [farmingRaid, setFarmingRaid] = useState<Raid>()

  // Refs
  const listRef = createRef<HTMLDivElement>()
  const inputRef = createRef<HTMLInputElement>()
  const sortButtonRef = createRef<HTMLButtonElement>()

  // ----------------------------------------------
  // Methods: Lifecycle Hooks
  // ----------------------------------------------

  // Fetch all raids on mount
  useEffect(() => {
    api.raidGroups().then((response) => sortGroups(response.data))
  }, [])

  // Set current raid and section when the component mounts
  useEffect(() => {
    // if (appState.party.raid) {
    //   setCurrentRaid(appState.party.raid)
    //   if (appState.party.raid.group.section > 0) {
    //     setCurrentSection(appState.party.raid.group.section)
    //   } else {
    //     setCurrentSection(1)
    //   }
    // } else if (props.showAllRaidsOption && !currentRaid) {
    //   setCurrentRaid(allRaidsOption)
    // }
  }, [])

  // Set current raid and section when the current raid changes
  useEffect(() => {
    if (props.currentRaid) {
      setCurrentRaid(props.currentRaid)
      if (appState.party.raid && appState.party.raid.group.section > 0)
        setCurrentSection(props.currentRaid.group.section)
      else setCurrentSection(1)
    }
  }, [props.currentRaid])

  // Scroll to the top of the list when the user switches tabs
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [currentSection])

  useEffect(() => {
    setTabIndex(NUM_ELEMENTS + 1)
  }, [currentSection])

  // ----------------------------------------------
  // Methods: Event Handlers
  // ----------------------------------------------

  // Handle Escape key press event
  const handleEscapeKeyPressed = useCallback(() => {
    if (listRef.current) {
      listRef.current.focus()
    }
  }, [open, currentRaid, sortButtonRef])

  // Handle Arrow key press event by focusing the list item above or below the current one based on the direction
  const handleArrowKeyPressed = useCallback(
    (direction: 'Up' | 'Down') => {
      const current = listRef.current?.querySelector(
        '.Raid:focus'
      ) as HTMLElement | null

      if (current) {
        let next: Element | null | undefined

        if (direction === 'Down' && !current.nextElementSibling) {
          const nextParent =
            current.parentElement?.parentElement?.nextElementSibling
          next = nextParent?.querySelector('.Raid')
        } else if (direction === 'Up' && !current.previousElementSibling) {
          const previousParent =
            current.parentElement?.parentElement?.previousElementSibling
          next = previousParent?.querySelector('.Raid:last-child')
        } else {
          next =
            direction === 'Up'
              ? current.previousElementSibling
              : current.nextElementSibling
        }

        if (next) {
          ;(next as HTMLElement).focus()
        }
      }
    },
    [open, currentRaid, listRef]
  )

  // Scroll to an item in the list when it is selected
  const scrollToItem = useCallback(
    (node) => {
      if (!scrolled && open && currentRaid && listRef.current && node) {
        const { top: listTop } = listRef.current.getBoundingClientRect()
        const { top: itemTop } = node.getBoundingClientRect()

        listRef.current.scrollTop = itemTop - listTop
        node.focus()
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

      setFarmingRaid(groups[0].raids[0])

      setSections(sections)
    },
    [setSections]
  )

  const handleSortButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    // If the tab key is pressed without the Shift key, focus the raid list
    if (event.key === 'Tab' && !event.shiftKey) {
      if (listRef.current) {
        listRef.current.focus()
      }
    }
  }

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault()
      if (sortButtonRef.current) {
        sortButtonRef.current.focus()
      }
    }

    // If the enter key is pressed, focus the first raid item in the list
    else if (event.key === 'Enter') {
      event.preventDefault()
      if (listRef.current) {
        const raid = listRef.current.querySelector('.Raid')
        if (raid) {
          ;(raid as HTMLElement).focus()
        }
      }
    }
  }

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
      if (
        currentRaid &&
        currentRaid.slug !== 'all' &&
        currentRaid.group.section > 0
      ) {
        setCurrentSection(currentRaid.group.section)
      }
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

  // Render the ungrouped raid group
  function renderUngroupedRaids() {
    let ungroupedRaids = farmingRaid ? [farmingRaid] : []

    if (props.showAllRaidsOption) {
      ungroupedRaids.push(allRaidsOption)
    }

    const options = generateRaidItems(ungroupedRaids)

    return (
      <CommandGroup
        data-section={untitledGroup.section}
        className={classNames({
          CommandGroup: true,
        })}
        key="ungrouped-raids"
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
        role="listitem"
        tabIndex={0}
        value={raid.slug}
        onEscapeKeyPressed={handleEscapeKeyPressed}
        onArrowKeyPressed={handleArrowKeyPressed}
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
          tabIndex={2}
          onClick={() => setCurrentSection(2)}
        >
          {t('raids.sections.events')}
        </Segment>
        <Segment
          groupName="raid_section"
          name="raids"
          selected={currentSection === 1}
          tabIndex={3}
          onClick={() => setCurrentSection(1)}
        >
          {t('raids.sections.raids')}
        </Segment>
        <Segment
          groupName="raid_section"
          name="solo"
          selected={currentSection === 3}
          tabIndex={4}
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
          onKeyDown={handleSortButtonKeyDown}
          ref={sortButtonRef}
          tabIndex={5}
        />
      </Tooltip>
    )
  }

  // Renders the content for the Popover trigger.
  function renderTriggerContent() {
    if (currentRaid) {
      const element = (
        <>
          {!props.minimal ? (
            <div className="Info">
              <span className="Group">{currentRaid.group.name[locale]}</span>
              <span className="Separator">/</span>
              <span className={classNames({ Raid: true }, linkClass)}>
                {currentRaid.name[locale]}
              </span>
            </div>
          ) : (
            <span className={classNames({ Raid: true }, linkClass)}>
              {currentRaid.name[locale]}
            </span>
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
          tabIndex={1}
          ref={inputRef}
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
      placeholder={
        props.showAllRaidsOption ? t('raids.all') : t('raids.placeholder')
      }
      trigger={{
        className: classNames({
          Raid: true,
          Highlighted: props.showAllRaidsOption,
        }),
      }}
      triggerTabIndex={props.tabIndex}
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
          role="listbox"
          tabIndex={6}
          onKeyDown={handleListKeyDown}
        >
          {renderUngroupedRaids()}
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
