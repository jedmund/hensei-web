import React from 'react'
import WeaponUnit from '~components/WeaponUnit'

import './index.scss'

// GridType
export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

// Props
interface Props {
    grid: GridArray<GridWeapon>
    editable: boolean
    exists: boolean
    found?: boolean
    offset: number
    onClick: (position: number) => void
    updateUncap: (id: string, uncap: number) => void
}

const ExtraWeapons = (props: Props) => {
    const numWeapons: number = 3

    return (
        <div id="ExtraWeapons">
            <span>Additional<br />Weapons</span>
            <ul id="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <WeaponUnit 
                                    editable={props.editable}
                                    position={props.offset + i} 
                                    unitType={1}
                                    gridWeapon={props.grid[props.offset + i]}
                                    onClick={() => { props.onClick(props.offset + i)}} 
                                    updateUncap={updateUncap}
                                />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default ExtraWeapons
