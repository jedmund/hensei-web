import React, { useState } from 'react'
import { useModal as useModal } from '~utils/useModal'

import CharacterUnit from '~components/CharacterUnit'
import SearchModal from '~components/SearchModal'

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
    const { open, openModal, closeModal } = useModal()
    const [searchPosition, setSearchPosition] = useState(0)

    const numCharacters: number = 5

    function isCharacter(object: Character | Weapon | Summon): object is Character {
        // There aren't really any unique fields here
        return (object as Character).gender !== undefined
    }

    function openSearchModal(position: number) {
        setSearchPosition(position)
        openModal()
    }

    function receiveCharacter(character: Character, position: number) {
        props.onSelect(GridType.Character, character, position)
    }

    function sendData(object: Character | Weapon | Summon, position: number) {
        if (isCharacter(object)) {
            receiveCharacter(object, position)
        }
    }

    return (
        <div className="CharacterGrid">
            <ul id="grid_characters">
                {
                    Array.from(Array(numCharacters)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <CharacterUnit 
                                    onClick={() => { openSearchModal(i) }}
                                    editable={props.editable}
                                    position={i} 
                                    character={props.grid[i]}
                                />
                            </li>
                        )
                    })
                }
                {open ? (
                <SearchModal 
                    grid={props.grid}
                    close={closeModal}
                    send={sendData}
                    fromPosition={searchPosition}
                    object="characters"
                    placeholderText="Search for a character..."
                />
            ) : null}
            </ul>
        </div>
    )
}

export default CharacterGrid
