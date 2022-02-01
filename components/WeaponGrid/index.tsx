import React, { useCallback, useMemo, useState } from 'react'
import { useModal as useModal } from '~utils/useModal'

import debounce from 'lodash.debounce'

import SearchModal from '~components/SearchModal'
import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

import './index.scss'
import { delay } from 'lodash'
import api from '~utils/api'

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
    mainhand?: GridWeapon | undefined
    grid: GridArray<GridWeapon>
    extra: boolean
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, weapon: Weapon, position: number) => void
}

const WeaponGrid = (props: Props) => {
    const { open, openModal, closeModal } = useModal()
    const [searchPosition, setSearchPosition] = useState(0)

    const numWeapons: number = 9
    const searchGrid: GridArray<Weapon> = Object.values(props.grid).map((o) => o.weapon)

    function receiveWeapon(weapon: Weapon, position: number) {
        props.onSelect(GridType.Weapon, weapon, position)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isWeapon(object)) {
            receiveWeapon(object, position)
        }
    }

    function isWeapon(object: Character | Weapon | Summon): object is Weapon {
        return (object as Weapon).proficiency !== undefined
    }

    function openSearchModal(position: number) {
        setSearchPosition(position)
        openModal()
    }

    async function updateUncap(id: string, level: number) {
        console.log(id, level) 
        await api.updateUncap('weapon', id, level)
            .then(response => {
                console.log(response.data)
            })
            .catch(error => {
                console.log(error)
            })
    }

    const initiateUncapUpdate = (id: string, uncapLevel: number) => {
        debouncedAction(id, uncapLevel)
    }

    const debouncedAction = useCallback(
        () => debounce((id, number) => { 
            updateUncap(id, number)
        }, 1000), []
    )()

    const extraGrid = (
        <ExtraWeapons 
            grid={props.grid} 
            editable={props.editable} 
            exists={false}
            offset={numWeapons}
            onClick={openSearchModal}
            updateUncap={initiateUncapUpdate}
        />
    )
    
    return (
        <div id="weapon_grids">
            <div id="WeaponGrid">
                <WeaponUnit 
                    editable={props.editable}
                    key="grid_mainhand"
                    position={-1} 
                    unitType={0}
                    gridWeapon={props.mainhand}
                    onClick={() => { openSearchModal(-1) }}
                    updateUncap={initiateUncapUpdate}
                />

                <ul id="grid_weapons">
                    {
                        Array.from(Array(numWeapons)).map((x, i) => {
                            return (
                                <li key={`grid_unit_${i}`} >
                                    <WeaponUnit 
                                        editable={props.editable}
                                        position={i} 
                                        unitType={1}
                                        gridWeapon={props.grid[i]}
                                        onClick={() => { openSearchModal(i) }}
                                        updateUncap={initiateUncapUpdate}
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

            {open ? (
                <SearchModal 
                    grid={searchGrid}
                    close={closeModal}
                    send={sendData}
                    fromPosition={searchPosition}
                    object="weapons"
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </div>
    )
}

export default WeaponGrid
