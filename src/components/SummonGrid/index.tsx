import React from 'react'
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
    const numSummons: number = 4

    function receiveSummon(summon: Summon, position: number) {
        props.onSelect(GridType.Summon, summon, position)
    }

    return (
        <div>
            <div className="SummonGrid">
                <div className="LabeledUnit">
                    <div className="Label">Main Summon</div>
                    <SummonUnit
                        editable={props.editable}
                        key="grid_main_summon"
                        onReceiveData={receiveSummon}
                        position={-1}
                        unitType={0}
                        summon={props.main}
                    />
                </div>

                <div className="LabeledUnit">
                    <div className="Label">Friend Summon</div>
                    <SummonUnit
                        editable={props.editable}
                        key="grid_friend_summon"
                        onReceiveData={receiveSummon}
                        position={4}
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
                </div>
            </div>
            
            <ExtraSummons 
                grid={props.grid} 
                editable={false} 
                exists={false} 
                offset={numSummons}
                onSelect={
                    function (type: GridType, summon: Summon, position: number): void {
                        throw new Error('Function not implemented.')
                    } 
                } 
            />
        </div>
    )
}

export default SummonGrid
