import React from 'react'
import SummonUnit from '~components/SummonUnit'
import './index.scss'

// Props
interface Props {
    grid: GridArray<GridSummon>
    editable: boolean
    exists: boolean
    found?: boolean
    offset: number
    onClick: (position: number) => void
    updateUncap: (id: string, position: number, uncap: number) => void
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
                                    editable={props.editable} 
                                    position={props.offset + i} 
                                    unitType={1}
                                    gridSummon={props.grid[props.offset + i]}
                                    onClick={() => { props.onClick(props.offset + i) }}
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

export default ExtraSummons
