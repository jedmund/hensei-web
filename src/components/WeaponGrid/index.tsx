import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

import WeaponUnit from '~components/WeaponUnit'

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
    mainhand?: Weapon | undefined
    grid: GridArray<Weapon>
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, weapon: Weapon, position: number) => void
    pushHistory?: (path: string) => void
}

const WeaponGrid = (props: Props) => {
    const numWeapons: number = 9

    function receiveWeapon(weapon: Weapon, position: number) {
        props.onSelect(GridType.Weapon, weapon, position)
    }

    return (
        <div className="WeaponGrid">
            <WeaponUnit 
                editable={props.editable}
                key="grid_mainhand"
                onReceiveData={receiveWeapon} 
                position={-1} 
                unitType={0}
                weapon={props.mainhand}
            />

            <ul id="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <WeaponUnit 
                                    editable={props.editable}
                                    onReceiveData={receiveWeapon} 
                                    position={i} 
                                    unitType={1}
                                    weapon={props.grid[i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default WeaponGrid
