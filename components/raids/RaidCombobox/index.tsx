import { createRef, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from 'cmdk'
import Popover from '~components/common/Popover'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import RaidItem from '~components/raids/RaidItem'
import Tooltip from '~components/common/Tooltip'

import api from '~utils/api'

interface Props {
  showAllRaidsOption: boolean
  currentRaid?: Raid
  defaultRaid?: Raid
  onChange?: (raid?: Raid) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

import Button from '~components/common/Button'
import ArrowIcon from '~public/icons/Arrow.svg'

import './index.scss'
import classNames from 'classnames'
import { appState } from '~utils/appState'

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
  const [search, setSearch] = useState('')
  const [sections, setSections] = useState<RaidGroup[][]>()
  const [currentRaid, setCurrentRaid] = useState<Raid>()

  // Refs
  const listRef = createRef<HTMLDivElement>()
  const selectedRef = createRef<HTMLDivElement>()

  useEffect(() => {
    if (appState.party.raid) {
      setCurrentRaid(appState.party.raid)
      setCurrentSection(appState.party.raid.group.section)
    }
  }, [])

  // Scroll to the top of the list when the user switches tabs
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [currentSection])

  const scrollToItem = useCallback(
    (node) => {
      if (
        !scrolled &&
        open &&
        currentRaid &&
        listRef.current &&
        node !== null
      ) {
        const listRect = listRef.current.getBoundingClientRect()
        const itemRect = node.getBoundingClientRect()
        const distance = itemRect.top - listRect.top

        listRef.current.scrollTop = distance
        setScrolled(true)
      }
    },
    [open, currentRaid, listRef]
  )

  // Methods: Convenience methods

  function reverseSort() {
    if (sort === Sort.ASCENDING) setSort(Sort.DESCENDING)
    else setSort(Sort.ASCENDING)
  }

  // Sort raids into defined groups
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

  function handleValueChange(raid: Raid) {
    setCurrentRaid(raid)
    setOpen(false)
    setScrolled(false)
    if (props.onChange) props.onChange(raid)
  }

  function toggleOpen() {
    if (open) {
      if (currentRaid) setCurrentSection(currentRaid.group.section)
      setScrolled(false)
    }
    setOpen(!open)
  }

  const linkClass = classNames({
    wind: currentRaid && currentRaid.element == 1,
    fire: currentRaid && currentRaid.element == 2,
    water: currentRaid && currentRaid.element == 3,
    earth: currentRaid && currentRaid.element == 4,
    dark: currentRaid && currentRaid.element == 5,
    light: currentRaid && currentRaid.element == 6,
  })

  // Fetch all raids on mount
  useEffect(() => {
    api.raidGroups().then((response) => sortGroups(response.data))
  }, [sortGroups])

  // Methods: Rendering
  function renderRaidSections() {
    let sections = []
    for (let i = 0; i < NUM_SECTIONS; i++) {
      sections.push(renderRaidSection(i))
    }
    return sections
  }

  function renderRaidSection(section: number) {
    if (!sections || !sections[section]) return
    else {
      const currentSection = sections[section]
      return currentSection
        .sort((a, b) => {
          if (sort === Sort.ASCENDING) return a.order - b.order
          else return b.order - a.order
        })
        .map((group, i) => renderRaidGroup(section, i))
    }
  }

  // Render JSX for each raid option, sorted into optgroups
  function renderRaidGroup(section: number, index: number) {
    let options = []

    if (!sections || !sections[section] || !sections[section][index]) return
    else {
      const group = sections[section][index]

      options = group.raids
        .sort((a, b) => {
          if (a.element > 0 && b.element > 0) return a.element - b.element
          else if (a.name.en.includes('NM') && b.name.en.includes('NM'))
            return a.level < b.level ? -1 : 1
          else return a.name.en < b.name.en ? -1 : 1
        })
        .map((item, i) => renderRaidItem(item, i))

      return (
        <CommandGroup
          data-section={group.section}
          className={classNames({
            CommandGroup: true,
            Hidden: group.section !== currentSection,
          })}
          key={group.name[locale].toLowerCase().replace(' ', '-')}
          heading={
            <div className="Label">
              {group.name[locale]}
              <div className="Separator" />
            </div>
          }
        >
          {options}
        </CommandGroup>
      )
    }
  }

  function renderRaidItem(raid: Raid, key: number) {
    return (
      <RaidItem
        className={currentRaid && currentRaid.id === raid.id ? 'Selected' : ''}
        icon={{
          alt: raid.name[locale],
          src: `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/raids/${raid.slug}.png`,
        }}
        extra={raid.group.extra}
        key={key}
        selected={currentRaid?.id === raid.id}
        ref={
          currentRaid && currentRaid.id === raid.id ? scrollToItem : undefined
        }
        value={raid.slug}
        onSelect={() => handleValueChange(raid)}
      >
        {raid.name[locale]}
      </RaidItem>
    )
  }

  return (
    <Popover
      className="Flush"
      open={open}
      onOpenChange={toggleOpen}
      placeholder={t('raids.placeholder')}
      trigger={{ className: 'Raid' }}
      value={
        currentRaid
          ? {
              element: (
                <>
                  <div className="Info">
                    <span className="Group">
                      {currentRaid?.group.name[locale]}
                    </span>
                    <span className="Separator">/</span>
                    <span className={classNames({ Raid: true }, linkClass)}>
                      {currentRaid?.name[locale]}
                    </span>
                  </div>
                  {currentRaid.group.extra ? (
                    <i className="ExtraIndicator">EX</i>
                  ) : (
                    ''
                  )}
                </>
              ),
              rawValue: currentRaid?.id,
            }
          : undefined
      }
    >
      <Command className="Raid Combobox">
        <div className="Header">
          <CommandInput
            className="Input Bound"
            placeholder={t('search.placeholders.raid')}
            value={search}
            onValueChange={setSearch}
          />
          {!search ? (
            <div className="Controls">
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
                  leftAccessoryClassName={
                    sort === Sort.DESCENDING ? 'Flipped' : ''
                  }
                  onClick={reverseSort}
                />
              </Tooltip>
            </div>
          ) : (
            ''
          )}
        </div>
        <div
          className={classNames({ Raids: true, Searching: search !== '' })}
          ref={listRef}
        >
          {renderRaidSections()}
        </div>
      </Command>
    </Popover>
  )
}

export default RaidCombobox
