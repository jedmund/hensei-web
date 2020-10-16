import React, { useState } from 'react'
import SummonUnit from '~components/SummonUnit'

import './index.css'

interface Props {
    editable: boolean
}

const SummonGrid = (props: Props) => {
    const numSummons: number = 4

    const [mainSummon, setMainSummon] = useState<Summon>()
    const [friendSummon, setFriendSummon] = useState<Summon>()
    const [summons, setSummons] = useState<GridArray>({})
    const [partyId, setPartyId] = useState('')

    return (
        <div className="SummonGrid">
            <SummonUnit
                editable={props.editable}
                key="grid_main_summon"
                onReceiveData={() => {}}
                position={-1}
                unitType={0}
                summon={mainSummon}
            />

            <ul id="grid_summons">
                {
                    Array.from(Array(numSummons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <SummonUnit 
                                    editable={props.editable}
                                    onReceiveData={() => {}} 
                                    position={i} 
                                    unitType={1}
                                    summon={summons[i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>

            <SummonUnit
                editable={props.editable}
                key="grid_friend_summon"
                onReceiveData={() => {}}
                position={-1}
                unitType={2}
                summon={friendSummon}
            />
        </div>
    )
}

export default SummonGrid
