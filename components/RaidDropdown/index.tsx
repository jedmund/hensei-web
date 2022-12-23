import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Select from '~components/Select'
import SelectItem from '~components/SelectItem'
import SelectGroup from '~components/SelectGroup'

import api from '~utils/api'
import organizeRaids from '~utils/organizeRaids'
import { appState } from '~utils/appState'
import { raidGroups } from '~utils/raidGroups'

import './index.scss'

// Props
interface Props {
  showAllRaidsOption: boolean
  currentRaid?: string
  defaultRaid?: string
  onChange?: (slug?: string) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

// Set up empty raid for "All raids"
const allRaidsOption = {
  id: '0',
  name: {
    en: 'All raids',
    ja: '全て',
  },
  slug: 'all',
  level: 0,
  group: 0,
  element: 0,
}

const RaidDropdown = React.forwardRef<HTMLSelectElement, Props>(
  function useFieldSet(props, ref) {
    // Set up router for locale
    const router = useRouter()
    const locale = router.locale || 'en'

    // Set up local states for storing raids
    const [open, setOpen] = useState(false)
    const [currentRaid, setCurrentRaid] = useState<Raid>()
    const [raids, setRaids] = useState<Raid[]>()
    const [sortedRaids, setSortedRaids] = useState<Raid[][]>()

    function openRaidSelect() {
      setOpen(!open)
    }

    // Organize raids into groups on mount
    const organizeAllRaids = useCallback(
      (raids: Raid[]) => {
        let { sortedRaids } = organizeRaids(raids)

        if (props.showAllRaidsOption) {
          raids.unshift(allRaidsOption)
          sortedRaids[0].unshift(allRaidsOption)
        }

        setRaids(raids)
        setSortedRaids(sortedRaids)
        appState.raids = raids
      },
      [props.showAllRaidsOption]
    )

    // Fetch all raids on mount
    useEffect(() => {
      api.endpoints.raids
        .getAll()
        .then((response) => organizeAllRaids(response.data))
    }, [organizeRaids])

    // Set current raid on mount
    useEffect(() => {
      if (raids && props.currentRaid) {
        const raid = raids.find((raid) => raid.slug === props.currentRaid)
        setCurrentRaid(raid)
      }
    }, [raids, props.currentRaid])

    // Enable changing select value
    function handleChange(value: string) {
      if (props.onChange) props.onChange(value)

      if (raids) {
        const raid = raids.find((raid) => raid.slug === value)
        setCurrentRaid(raid)
      }
    }

    // Render JSX for each raid option, sorted into optgroups
    function renderRaidGroup(index: number) {
      const options =
        sortedRaids &&
        sortedRaids.length > 0 &&
        sortedRaids[index].length > 0 &&
        sortedRaids[index]
          .sort((a, b) => a.element - b.element)
          .map((item, i) => {
            return (
              <SelectItem key={i} value={item.slug}>
                {item.name[locale]}
              </SelectItem>
            )
          })
      return (
        <SelectGroup
          key={index}
          label={raidGroups[index].name[locale]}
          separator={false}
        >
          {options}
        </SelectGroup>
      )
    }

    return (
      <Select
        defaultValue={props.showAllRaidsOption ? props.currentRaid : undefined}
        placeholder={'Select a raid...'}
        open={open}
        onClick={openRaidSelect}
        onChange={handleChange}
      >
        {Array.from(Array(sortedRaids?.length)).map((x, i) =>
          renderRaidGroup(i)
        )}
      </Select>
    )
  }
)

export default RaidDropdown
