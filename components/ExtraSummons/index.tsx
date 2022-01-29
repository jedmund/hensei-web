import React from 'react'
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
    grid: GridArray<Summon>
    editable: boolean
    exists: boolean
    found?: boolean
    offset: number
    onClick: (position: number) => void
}

const ExtraSummons = (props: Props) => {
    const numSummons: number = 2

    return (
        <div id="ExtraSummons">
            <span>Sub Aura Summons</span>
            <ul id="grid_summons">
                {
                    Array.from(Array(numSummons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <SummonUnit 
                                    onClick={() => { props.onClick(props.offset + i) }}
                                    editable={props.editable} 
                                    position={props.offset + i} 
                                    unitType={1}
                                    summon={props.grid[props.offset + i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default ExtraSummons
