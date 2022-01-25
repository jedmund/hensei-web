import React, { useState } from 'react'
import CharacterUnit from '~components/CharacterUnit'

import './index.scss'

export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

interface Props {
    userId?: string
    grid: GridArray<Character>
    editable: boolean
    exists: boolean
    onSelect: (type: GridType, character: Character, position: number) => void
}

const CharacterGrid = (props: Props) => {
    const numCharacters: number = 5

    function receiveCharacter(character: Character, position: number) {
        props.onSelect(GridType.Character, character, position)
    }

    return (
        <div className="CharacterGrid">
            <ul id="grid_characters">
                {
                    Array.from(Array(numCharacters)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <CharacterUnit 
                                    editable={props.editable}
                                    onReceiveData={receiveCharacter} 
                                    position={i} 
                                    character={props.grid[i]}
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
