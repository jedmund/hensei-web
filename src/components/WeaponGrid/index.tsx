import React from 'react'
import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

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
    userId?: string
    partyId?: string
    mainhand?: Weapon | undefined
    grid: GridArray<Weapon>
    extra: boolean
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, weapon: Weapon, position: number) => void
}

const WeaponGrid = (props: Props) => {
    const numWeapons: number = 9

    const extraGrid = (
        <ExtraWeapons 
            grid={props.grid} 
            editable={props.editable} 
            exists={false} 
            onSelect={
                function (type: GridType, weapon: Weapon, position: number): void {
                    throw new Error('Function not implemented.')
                } 
            } 
        />
    )

    function receiveWeapon(weapon: Weapon, position: number) {
        props.onSelect(GridType.Weapon, weapon, position)
    }

    return (
        <div id="weapon_grids">
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

            { (() => {
                if(props.extra) {
                    return extraGrid
                }    
            })() }
        </div>
    )
}

export default WeaponGrid
