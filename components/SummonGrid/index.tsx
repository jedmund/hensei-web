import React, { useCallback, useState } from 'react'
import { useModal as useModal } from '~utils/useModal'

import debounce from 'lodash.debounce'

import SearchModal from '~components/SearchModal'
import SummonUnit from '~components/SummonUnit'
import ExtraSummons from '~components/ExtraSummons'

import api from '~utils/api'
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
    main?: GridSummon | undefined
    friend?: GridSummon | undefined
    grid: GridArray<GridSummon>
    editable: boolean
    exists: boolean
    found?: boolean
    onSelect: (type: GridType, summon: Summon, position: number) => void
}

const SummonGrid = (props: Props) => {
    const { open, openModal, closeModal } = useModal()
    const [searchPosition, setSearchPosition] = useState(0)

    const numSummons: number = 4
    const searchGrid: GridArray<Summon> = Object.values(props.grid).map((o) => o.summon)

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

    function openSearchModal(position: number) {
        setSearchPosition(position)
        openModal()
    }

    async function updateUncap(id: string, level: number) {
        await api.updateUncap('summon', id, level)
            .catch(error => {
                console.error(error)
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

    return (
        <div>
            <div className="SummonGrid">
                <div className="LabeledUnit">
                    <div className="Label">Main Summon</div>
                    <SummonUnit
                        editable={props.editable}
                        key="grid_main_summon"
                        position={-1}
                        unitType={0}
                        gridSummon={props.main}
                        onClick={() => { openSearchModal(-1) }}
                        updateUncap={initiateUncapUpdate}
                    />
                </div>

                <div className="LabeledUnit">
                    <div className="Label">Friend Summon</div>
                    <SummonUnit
                        editable={props.editable}
                        key="grid_friend_summon"
                        position={6}
                        unitType={2}
                        gridSummon={props.friend}
                        onClick={() => { openSearchModal(6) }}
                        updateUncap={initiateUncapUpdate}
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
                                            editable={props.editable}
                                            position={i} 
                                            unitType={1}
                                            gridSummon={props.grid[i]}
                                            onClick={() => { openSearchModal(i) }}
                                            updateUncap={initiateUncapUpdate}
                                        />
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </div>
            
            <ExtraSummons 
                grid={props.grid} 
                editable={props.editable} 
                exists={false} 
                offset={numSummons}
                onClick={openSearchModal}
                updateUncap={initiateUncapUpdate}
            />

            {open ? (
                <SearchModal 
                    grid={searchGrid}
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
