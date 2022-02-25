import { group } from 'console'
import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

import './index.scss'

// Props
interface Props {}

const RaidDropdown = (props: Props) => {
    const [cookies, _] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: { 'Authorization': `Bearer ${cookies.user.access_token}` }
    } : {}

    const [raids, setRaids] = useState<Raid[][]>()
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
                organizeRaids(response.data.map((r: any) => r.raid))
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
        <select>
            { Array.from(Array(raids?.length)).map((x, i) => {
                return raidGroup(i)
            })}
        </select>
    )
}

export default RaidDropdown
