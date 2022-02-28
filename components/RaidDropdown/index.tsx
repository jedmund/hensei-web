import React, { useCallback, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'

import { appState } from '~utils/appState'
import api from '~utils/api'

import './index.scss'

// Props
interface Props {
    allOption: boolean
    selected?: string
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
    onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

const RaidDropdown = React.forwardRef<HTMLSelectElement, Props>(function useFieldSet(props, ref) {
    const [cookies] = useCookies(['user'])
    const [raids, setRaids] = useState<Raid[][]>()

    const raidGroups = [
        'Assorted', 'Omega', 'T1 Summons', 'T2 Summons',
        'Primarchs', 'Nightmare', 'Omega (Impossible)', 'Omega II',
        'Tier 1 Summons (Impossible)', 'Tier 3 Summons', 'Ennead', 'Malice',
        '6-Star Raids', 'Six-Dragons', 'Nightmare (Impossible)', 'Astral', 
        'Super Ultimate'
    ]

    const organizeRaids = useCallback((raids: Raid[]) => {
        const numGroups = Math.max.apply(Math, raids.map(raid => raid.group))
        let groupedRaids = []

        for (let i = 0; i <= numGroups; i++) {
            groupedRaids[i] = raids.filter(raid => raid.group == i)
        }

        if (props.allOption)
            groupedRaids[0].unshift({
                id: '0',
                name: {
                    en: 'All raids',
                    jp: '全て'
                },
                level: 0,
                group: 0,
                element: 0
            })

        setRaids(groupedRaids)
    }, [props.allOption])

    useEffect(() => {
        const headers = (cookies.user != null) ? {
            headers: { 'Authorization': `Bearer ${cookies.user.access_token}` }
        } : {}

        function fetchRaids() {
            console.log("Fetching list of raids...")
            api.endpoints.raids.getAll(headers)
                .then((response) => {
                    const raids = response.data.map((r: any) => r.raid)
                    
                    appState.raids = raids
                    organizeRaids(raids)
                })
        }

        fetchRaids()
    }, [cookies.user, organizeRaids])

    function raidGroup(index: number) {
        const options = raids && raids.length > 0 && raids[index].length > 0 && 
            raids[index].sort((a, b) => a.element - b.element).map((item, i) => {
                return (
                    <option key={i} value={item.id}>{item.name.en}</option>
                )
            })
        
        return (
            <optgroup key={index} label={raidGroups[index]}>
                {options}
            </optgroup>
        )
    }
    
    return (
        <select key={props.selected} defaultValue={props.selected} onBlur={props.onBlur} onChange={props.onChange} ref={ref}>
            { Array.from(Array(raids?.length)).map((x, i) => {
                return raidGroup(i)
            })}
        </select>
    )
})

export default RaidDropdown
