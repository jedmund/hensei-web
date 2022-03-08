import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import api from '~utils/api'
import { appState } from '~utils/appState'
import { raidGroups } from '~utils/raidGroups'

import './index.scss'

// Props
interface Props {
    showAllRaidsOption: boolean
    currentRaid?: string
    onChange?: (slug?: string) => void
    onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

const RaidDropdown = React.forwardRef<HTMLSelectElement, Props>(function useFieldSet(props, ref) {
    // Set up router for locale
    const router = useRouter()
    const locale = router.locale || 'en'

    // Set up local states for storing raids
    const [currentRaid, setCurrentRaid] = useState<Raid>()
    const [raids, setRaids] = useState<Raid[]>()
    const [sortedRaids, setSortedRaids] = useState<Raid[][]>()

    // Organize raids into groups on mount
    const organizeRaids = useCallback((raids: Raid[]) => {
        // Set up empty raid for "All raids"
        const all = {
            id: '0',
            name: {
                en: 'All raids',
                ja: '全て'
            },
            slug: 'all',
            level: 0,
            group: 0,
            element: 0
        }
        
        const numGroups = Math.max.apply(Math, raids.map(raid => raid.group))
        let groupedRaids = []

        for (let i = 0; i <= numGroups; i++) {
            groupedRaids[i] = raids.filter(raid => raid.group == i)
        }

        if (props.showAllRaidsOption) {
            raids.unshift(all)
            groupedRaids[0].unshift(all)
        }

        setRaids(raids)
        setSortedRaids(groupedRaids)
        appState.raids = raids
    }, [props.showAllRaidsOption])

    // Fetch all raids on mount
    useEffect(() => {
        api.endpoints.raids.getAll()
            .then(response => organizeRaids(response.data.map((r: any) => r.raid)))
    }, [organizeRaids])

    // Set current raid on mount
    useEffect(() => {
        if (raids && props.currentRaid) {
            const raid = raids.find(raid => raid.slug === props.currentRaid)
            setCurrentRaid(raid)
        }
    }, [raids, props.currentRaid])

    // Enable changing select value
    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        if (props.onChange) props.onChange(event.target.value)

        if (raids) {
            const raid = raids.find(raid => raid.slug === event.target.value)
            setCurrentRaid(raid)
        }
    }

    // Render JSX for each raid option, sorted into optgroups
    function renderRaidGroup(index: number) {
        const options = sortedRaids && sortedRaids.length > 0 && sortedRaids[index].length > 0 && 
            sortedRaids[index].sort((a, b) => a.element - b.element).map((item, i) => {
                return (
                    <option key={i} value={item.slug}>{item.name[locale]}</option>
                )
            })
        
        return (
            <optgroup key={index} label={raidGroups[index].name[locale]}>
                {options}
            </optgroup>
        )
    }
    
    return (
        <select 
            key={currentRaid?.slug} 
            value={currentRaid?.slug} 
            onBlur={props.onBlur} 
            onChange={handleChange} 
            ref={ref}>
                { Array.from(Array(sortedRaids?.length)).map((x, i) => renderRaidGroup(i)) }
        </select>
    )
})

export default RaidDropdown
