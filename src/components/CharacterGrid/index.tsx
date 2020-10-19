import React, { useState } from 'react'
import CharacterUnit from '~components/CharacterUnit'

import './index.css'

export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

interface Props {
    editable: boolean
    exists: boolean
    onSelect: (type: GridType, character: Character, position: number) => void
}

const CharacterGrid = (props: Props) => {
    const numCharacters: number = 5

    const [characters, setCharacters] = useState<GridArray<Character>>({})
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
