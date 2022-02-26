import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'

import { appState } from '~utils/appState'
import api from '~utils/api'

import './index.scss'

// Props
interface Props {
    selected?: string
    onBlur: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

const RaidDropdown = React.forwardRef<HTMLSelectElement, Props>(function fieldSet(props, ref) {
    const [cookies, _] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: { 'Authorization': `Bearer ${cookies.user.access_token}` }
    } : {}

    const [raids, setRaids] = useState<Raid[][]>()
    const [flatRaids, setFlatRaids] = useState<Raid[]>()

    const raidGroups = [
        'Assorted',
        'Omega',
        'T1 Summons',
        'T2 Summons',
        'Primarchs',
        'Nightmare',
        'Omega (Impossible)',
        'Omega II',
        'Tier 1 Summons (Impossible)',
        'Tier 3 Summons',
        'Ennead',
        'Malice',
        '6-Star Raids',
        'Six-Dragons',
        'Nightmare (Impossible)',
        'Astral',
        'Super Ultimate'
    ]

    useEffect(() => {
        fetchRaids()
    }, [])
    
    function fetchRaids() {
        api.endpoints.raids.getAll(headers)
            .then((response) => {
                const raids = response.data.map((r: any) => r.raid)
                
                appState.raids = raids
                organizeRaids(raids)
            })
    }

    function organizeRaids(raids: Raid[]) {
        const numGroups = Math.max.apply(Math, raids.map(raid => raid.group))
        let groupedRaids = []

        for (let i = 0; i <= numGroups; i++) {
            groupedRaids[i] = raids.filter(raid => raid.group == i)
        }

        setRaids(groupedRaids)
    }

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
        <select key={props.selected} defaultValue={props.selected} onBlur={props.onBlur} ref={ref}>
            { Array.from(Array(raids?.length)).map((x, i) => {
                return raidGroup(i)
            })}
        </select>
    )
})

export default RaidDropdown
