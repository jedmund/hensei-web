/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useModal as useModal } from '~utils/useModal'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import CharacterUnit from '~components/CharacterUnit'
import SearchModal from '~components/SearchModal'

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
    partyId?: string
    characters: GridArray<GridCharacter>
    editable: boolean
    createParty: () => Promise<AxiosResponse<any, any>>
    pushHistory?: (path: string) => void
}

const CharacterGrid = (props: Props) => {
    // Constants
    const numCharacters: number = 5

    // Cookies
    const [cookies, _] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    // Set up states for Grid data
    const [characters, setCharacters] = useState<GridArray<GridCharacter>>({})

    // Set up states for Search
    const { open, openModal, closeModal } = useModal()
    const [itemPositionForSearch, setItemPositionForSearch] = useState(0)

    // Create a temporary state to store previous character uncap values
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Create a state dictionary to store pure objects for Search
    const [searchGrid, setSearchGrid] = useState<GridArray<Character>>({})

    // Set states from props
    useEffect(() => {
        setCharacters(props.characters || {})
    }, [props])

    // Update search grid whenever characters are updated
    useEffect(() => {
        let newSearchGrid = Object.values(characters).map((o) => o.character)
        setSearchGrid(newSearchGrid)
    }, [characters])

    // Methods: Adding an object from search
    function openSearchModal(position: number) {
        setItemPositionForSearch(position)
        openModal()
    }

    function receiveCharacterFromSearch(object: Character | Weapon | Summon, position: number) {
        const character = object as Character

        if (!props.partyId) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveCharacter(party.id, character, position)
                        .then(response => storeGridCharacter(response.data.grid_character))
                })
        } else {
            saveCharacter(props.partyId, character, position)
                .then(response => storeGridCharacter(response.data.grid_character))
        }
    }

    async function saveCharacter(partyId: string, character: Character, position: number) {        
        return await api.endpoints.characters.create({
            'character': {
                'party_id': partyId,
                'character_id': character.id,
                'position': position,
                'mainhand': (position == -1),
                'uncap_level': characterUncapLevel(character)
            }
        }, headers)
    }

    function storeGridCharacter(gridCharacter: GridCharacter) {
        // Store the grid unit at the correct position
        let newCharacters = Object.assign({}, characters)
        newCharacters[gridCharacter.position] = gridCharacter
        setCharacters(newCharacters)
    }

    // Methods: Helpers
    function characterUncapLevel(character: Character) {
        let uncapLevel

        if (character.special) {
            uncapLevel = 3
            if (character.uncap.ulb) uncapLevel = 5
            else if (character.uncap.flb) uncapLevel = 4
        } else {
            uncapLevel = 4
            if (character.uncap.ulb) uncapLevel = 6
            else if (character.uncap.flb) uncapLevel = 5
        }

        return uncapLevel
    }

    // Methods: Updating uncap level
    // Note: Saves, but debouncing is not working properly
    async function saveUncap(id: string, position: number, uncapLevel: number) {
        try {
            await api.updateUncap('weapon', id, uncapLevel)
                .then(response => {
                    storeGridCharacter(response.data.grid_character)
                })
        } catch (error) {
            console.error(error)

            // Revert optimistic UI
            updateUncapLevel(position, previousUncapValues[position])

            // Remove optimistic key
            let newPreviousValues = {...previousUncapValues}
            delete newPreviousValues[position]
            setPreviousUncapValues(newPreviousValues)
        }
    }

    const initiateUncapUpdate = useCallback(
        (id: string, position: number, uncapLevel: number) => {
            debouncedAction(id, position, uncapLevel)

            // Save the current value in case of an unexpected result
            let newPreviousValues = {...previousUncapValues}
            newPreviousValues[position] = characters[position].uncap_level
            setPreviousUncapValues(newPreviousValues)

            // Optimistically update UI
            updateUncapLevel(position, uncapLevel)
        }, [previousUncapValues, characters]
    )

    const debouncedAction = useMemo(() =>
        debounce((id, position, number) => { 
            saveUncap(id, position, number)
        }, 1000), [saveUncap]
    )

    const updateUncapLevel = (position: number, uncapLevel: number) => {
        let newCharacters = Object.assign({}, characters)
        newCharacters[position].uncap_level = uncapLevel
        setCharacters(newCharacters)
    }

    // Render: JSX components
    return (
        <div className="CharacterGrid">
            <ul id="grid_characters">
                {Array.from(Array(numCharacters)).map((x, i) => {
                    return (
                        <li key={`grid_unit_${i}`} >
                            <CharacterUnit 
                                gridCharacter={props.characters[i]}
                                editable={props.editable}
                                position={i} 
                                onClick={() => { openSearchModal(i) }}
                                updateUncap={initiateUncapUpdate}
                            />
                        </li>
                    )
                })}

                {open ? (
                    <SearchModal 
                        grid={searchGrid}
                        close={closeModal}
                        send={receiveCharacterFromSearch}
                        fromPosition={itemPositionForSearch}
                        object="characters"
                        placeholderText="Search for a character..."
                    />
                ) : null}
            </ul>
        </div>
    )
}

export default CharacterGrid
