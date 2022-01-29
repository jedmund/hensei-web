import React, { useState } from 'react'
import { useModal as useModal } from '~utils/useModal'

import SearchModal from '~components/SearchModal'
import ExtraSummons from '~components/ExtraSummons'
import SummonUnit from '~components/SummonUnit'

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
    main?: Summon | undefined
    friend?: Summon | undefined
    grid: GridArray<Summon>
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, summon: Summon, position: number) => void
}

const SummonGrid = (props: Props) => {
    const { open, openModal, closeModal } = useModal()
    const [searchPosition, setSearchPosition] = useState(0)

    const numSummons: number = 4

    function openSearchModal(position: number) {
        setSearchPosition(position)
        openModal()
    }

    function receiveSummon(summon: Summon, position: number) {
        props.onSelect(GridType.Summon, summon, position)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isSummon(object)) {
            receiveSummon(object, position)
        }
    }

    function isSummon(object: Character | Weapon | Summon): object is Summon {
        // There aren't really any unique fields here
        return (object as Summon).granblue_id !== undefined
    }

    return (
        <div>
            <div className="SummonGrid">
                <div className="LabeledUnit">
                    <div className="Label">Main Summon</div>
                    <SummonUnit
                        onClick={() => { openSearchModal(0) }}
                        editable={props.editable}
                        key="grid_main_summon"
                        position={-1}
                        unitType={0}
                        summon={props.main}
                    />
                </div>

                <div className="LabeledUnit">
                    <div className="Label">Friend Summon</div>
                    <SummonUnit
                        onClick={() => { openSearchModal(6) }}
                        editable={props.editable}
                        key="grid_friend_summon"
                        position={6}
                        unitType={2}
                        summon={props.friend}
                    />
                </div>

                <div id="LabeledGrid">
                    <div className="Label">Summons</div>
                    <ul id="grid_summons">
                        {
                            Array.from(Array(numSummons)).map((x, i) => {
                                return (
                                    <li key={`grid_unit_${i}`} >
                                        <SummonUnit 
                                            onClick={() => { openSearchModal(i) }}
                                            editable={props.editable}
                                            position={i} 
                                            unitType={1}
                                            summon={props.grid[i]}
                                        />
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </div>
            
            <ExtraSummons 
                onClick={openSearchModal}
                grid={props.grid} 
                editable={props.editable} 
                exists={false} 
                offset={numSummons}
            />

            {open ? (
                <SearchModal 
                    grid={props.grid}
                    close={closeModal}
                    send={sendData}
                    fromPosition={searchPosition}
                    object="summons"
                    placeholderText="Search for a summon..."
                />
            ) : null}
        </div>
    )
}

export default SummonGrid
