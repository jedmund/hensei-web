import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

import SummonUnit from '~components/SummonUnit'

import './index.css'

// GridType
export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

// Props
interface Props {
    userId?: string
    partyId?: string
    main?: Summon | undefined
    friend?: Summon | undefined
    grid: GridArray<Summon>
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, summon: Summon, position: number) => void
    pushHistory?: (path: string) => void
}

const SummonGrid = (props: Props) => {
    const numSummons: number = 4

    function receiveSummon(summon: Summon, position: number) {
        props.onSelect(GridType.Summon, summon, position)
    }

    return (
        <div className="SummonGrid">
            <SummonUnit
                editable={props.editable}
                key="grid_main_summon"
                onReceiveData={receiveSummon}
                position={-1}
                unitType={0}
                summon={props.main}
            />

            <ul id="grid_summons">
                {
                    Array.from(Array(numSummons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <SummonUnit 
                                    editable={props.editable}
                                    onReceiveData={receiveSummon} 
                                    position={i} 
                                    unitType={1}
                                    summon={props.grid[i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>

            <SummonUnit
                editable={props.editable}
                key="grid_friend_summon"
                onReceiveData={receiveSummon}
                position={4}
                unitType={2}
                summon={props.friend}
            />
        </div>
    )
}

export default SummonGrid
