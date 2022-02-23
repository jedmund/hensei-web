import React from 'react'
import WeaponUnit from '~components/WeaponUnit'

import './index.scss'

// Props
interface Props {
    grid: GridArray<GridWeapon>
    editable: boolean
    found?: boolean
    offset: number
    onClick: (position: number) => void
    updateObject: (object: Character | Weapon | Summon, position: number) => void
    updateUncap: (id: string, position: number, uncap: number) => void
}

const ExtraWeapons = (props: Props) => {
    const numWeapons: number = 3

    return (
        <div id="ExtraGrid">
            <span>Additional<br />Weapons</span>
            <ul className="grid_weapons">
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
                                    updateObject={props.updateObject}
                                    updateUncap={props.updateUncap}
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
