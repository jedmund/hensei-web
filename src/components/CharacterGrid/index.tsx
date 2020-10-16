import React, { useState } from 'react'
import CharacterUnit from '~components/CharacterUnit'

import './index.css'

interface Props {
    editable: boolean
}

const CharacterGrid = (props: Props) => {
    const numCharacters: number = 5

    const [characters, setCharacters] = useState<GridArray>({})
    const [partyId, setPartyId] = useState('')

    return (
        <div className="CharacterGrid">
            <ul id="grid_characters">
                {
                    Array.from(Array(numCharacters)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <CharacterUnit 
                                    editable={props.editable}
                                    onReceiveData={() => {}} 
                                    position={i} 
                                    character={characters[i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default CharacterGrid
