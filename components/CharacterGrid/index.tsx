/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useModal as useModal } from '~utils/useModal'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import AppContext from '~context/AppContext'
import PartyContext from '~context/PartyContext'

import CharacterUnit from '~components/CharacterUnit'
import SearchModal from '~components/SearchModal'

import api from '~utils/api'
import './index.scss'

// Props
interface Props {
    slug?: string
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

    // Set up state for view management
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const { id, setId } = useContext(PartyContext)
    const { slug, setSlug } = useContext(PartyContext)
    const { editable, setEditable } = useContext(AppContext)

    // Set up states for Grid data
    const [characters, setCharacters] = useState<GridArray<GridCharacter>>({})

    // Set up states for Search
    const { open, openModal, closeModal } = useModal()
    const [itemPositionForSearch, setItemPositionForSearch] = useState(0)

    // Create a temporary state to store previous character uncap values
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Create a state dictionary to store pure objects for Search
    const [searchGrid, setSearchGrid] = useState<GridArray<Character>>({})
    
    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : slug
        if (shortcode) fetchGrid(shortcode)
        else setEditable(true)
    }, [slug, props.slug])

    // Initialize an array of current uncap values for each characters
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}
        Object.values(characters).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)
        setPreviousUncapValues(initialPreviousUncapValues)
    }, [props])
    
    // Update search grid whenever characters are updated
    useEffect(() => {
        let newSearchGrid = Object.values(characters).map((o) => o.character)
        setSearchGrid(newSearchGrid)
    }, [characters])

    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'characters' })
            .then(response => processResult(response))
            .catch(error => processError(error))
    }

    function processResult(response: AxiosResponse) {
        // Store the response
        const party = response.data.party
            
        // Get the party user and logged in user, if possible, to compare
        const partyUser = (party.user_id) ? party.user_id : undefined
        const loggedInUser = (cookies.user) ? cookies.user.user_id : ''

        if (partyUser != undefined && loggedInUser != undefined && partyUser === loggedInUser) {
            setEditable(true)
        }
        
        // Store the important party and state-keeping values
        setId(party.id)
        setFound(true)
        setLoading(false)

        // Populate the weapons in state
        populateCharacters(party.characters)
    }

    function processError(error: any) {
        if (error.response != null) {
            if (error.response.status == 404) {
                setFound(false)
                setLoading(false)
            }
        } else {
            console.error(error)
        }
    }

    function populateCharacters(list: [GridCharacter]) {
        let characters: GridArray<GridCharacter> = {}

        list.forEach((object: GridCharacter) => {
            if (object.position != null)
                characters[object.position] = object
        })

        setCharacters(characters)
    }


    // Methods: Adding an object from search
    function openSearchModal(position: number) {
        setItemPositionForSearch(position)
        openModal()
    }

    function receiveCharacterFromSearch(object: Character | Weapon | Summon, position: number) {
        const character = object as Character

        if (!id) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    setId(party.id)
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveCharacter(party.id, character, position)
                        .then(response => storeGridCharacter(response.data.grid_character))
                })
        } else {
            saveCharacter(id, character, position)
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
        storePreviousUncapValue(position)

        try {
            if (uncapLevel != previousUncapValues[position])
                await api.updateUncap('weapon', id, uncapLevel)
                    .then(response => { storeGridCharacter(response.data.grid_character) })
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
            memoizeAction(id, position, uncapLevel)

            // Optimistically update UI
            updateUncapLevel(position, uncapLevel)
        }, [previousUncapValues, characters]
    )

    const memoizeAction = useCallback(
        (id: string, position: number, uncapLevel: number) => {
            debouncedAction(id, position, uncapLevel)
        }, [props]
    )

    const debouncedAction = useMemo(() =>
        debounce((id, position, number) => {
            saveUncap(id, position, number)
        }, 500), [props, saveUncap]
    )

    const updateUncapLevel = (position: number, uncapLevel: number) => {
        let newCharacters = {...characters}
        newCharacters[position].uncap_level = uncapLevel
        setCharacters(newCharacters)
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}
         newPreviousValues[position] = characters[position].uncap_level

        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    return (
        <div id="CharacterGrid">
            <ul id="grid_characters">
                {Array.from(Array(numCharacters)).map((x, i) => {
                    return (
                        <li key={`grid_unit_${i}`} >
                            <CharacterUnit 
                                gridCharacter={characters[i]}
                                editable={editable}
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
