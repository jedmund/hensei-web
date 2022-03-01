/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import CharacterUnit from '~components/CharacterUnit'

import api from '~utils/api'
import { appState } from '~utils/appState'

import './index.scss'

// Props
interface Props {
    new: boolean
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
    const { party, grid } = useSnapshot(appState)

    const [slug, setSlug] = useState()
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [firstLoadComplete, setFirstLoadComplete] = useState(false)

    // Create a temporary state to store previous character uncap values
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})
    
    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : slug
        if (shortcode) fetchGrid(shortcode)
        else appState.party.editable = true
    }, [slug, props.slug])

    // Set the editable flag only on first load
    useEffect(() => {        
        if (!loading && !firstLoadComplete) {
            // If user is logged in and matches
            if ((cookies.user && party.user && cookies.user.user_id === party.user.id) || props.new)
                appState.party.editable = true
            else            
                appState.party.editable = false

            setFirstLoadComplete(true)
        }
    }, [props.new, cookies, party, loading, firstLoadComplete])

    // Initialize an array of current uncap values for each characters
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}
        Object.values(appState.grid.characters).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)
        setPreviousUncapValues(initialPreviousUncapValues)
    }, [appState.grid.characters])

    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'characters', params: headers })
            .then(response => processResult(response))
            .catch(error => processError(error))
    }

    function processResult(response: AxiosResponse) {
        // Store the response
        const party: Party = response.data.party
        
        // Store the important party and state-keeping values
        appState.party.id = party.id
        appState.party.user = party.user
        appState.party.favorited = party.favorited

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

    function populateCharacters(list: Array<GridCharacter>) {
        list.forEach((object: GridCharacter) => {
            if (object.position != null)
                appState.grid.characters[object.position] = object
        })
    }

    // Methods: Adding an object from search
    function receiveCharacterFromSearch(object: Character | Weapon | Summon, position: number) {
        const character = object as Character

        if (!party.id) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    appState.party.id = party.id
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveCharacter(party.id, character, position)
                        .then(response => storeGridCharacter(response.data.grid_character))
                        .catch(error => console.error(error))
                })
        } else {
            if (party.editable)
                saveCharacter(party.id, character, position)
                    .then(response => storeGridCharacter(response.data.grid_character))
                    .catch(error => console.error(error))
        }
    }

    async function saveCharacter(partyId: string, character: Character, position: number) { 
        return await api.endpoints.characters.create({
            'character': {
                'party_id': partyId,
                'character_id': character.id,
                'position': position,
                'uncap_level': characterUncapLevel(character)
            }
        }, headers)
    }

    function storeGridCharacter(gridCharacter: GridCharacter) {
        appState.grid.characters[gridCharacter.position] = gridCharacter
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
                await api.updateUncap('character', id, uncapLevel)
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

    function initiateUncapUpdate(id: string, position: number, uncapLevel: number) {
        memoizeAction(id, position, uncapLevel)

        // Optimistically update UI
        updateUncapLevel(position, uncapLevel)
    }

    const memoizeAction = useCallback(
        (id: string, position: number, uncapLevel: number) => {
            debouncedAction(id, position, uncapLevel)
        }, [props, previousUncapValues]
    )

    const debouncedAction = useMemo(() =>
        debounce((id, position, number) => {
            saveUncap(id, position, number)
        }, 500), [props, saveUncap]
    )

    const updateUncapLevel = (position: number, uncapLevel: number) => {
        appState.grid.characters[position].uncap_level = uncapLevel
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}

        if (grid.characters[position]) {
            newPreviousValues[position] = grid.characters[position].uncap_level
            setPreviousUncapValues(newPreviousValues)
        }
    }

    // Render: JSX components
    return (
        <div id="CharacterGrid">
            <ul id="grid_characters">
                {Array.from(Array(numCharacters)).map((x, i) => {
                    return (
                        <li key={`grid_unit_${i}`} >
                            <CharacterUnit 
                                gridCharacter={grid.characters[i]}
                                editable={party.editable}
                                position={i} 
                                updateObject={receiveCharacterFromSearch}
                                updateUncap={initiateUncapUpdate}
                            />
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default CharacterGrid
