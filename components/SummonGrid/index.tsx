/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import SummonUnit from '~components/SummonUnit'
import ExtraSummons from '~components/ExtraSummons'

import api from '~utils/api'
import state from '~utils/state'

import './index.scss'

// Props
interface Props {
    slug?: string
    createParty: () => Promise<AxiosResponse<any, any>>
    pushHistory?: (path: string) => void
}

const SummonGrid = (props: Props) => {
    // Constants
    const numSummons: number = 4

    // Cookies
    const [cookies, _] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    // Set up state for view management
    const { party, grid } = useSnapshot(state)

    const [slug, setSlug] = useState()
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)

    // Create a temporary state to store previous weapon uncap value
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : slug
        if (shortcode) fetchGrid(shortcode)
        else state.party.editable = true
    }, [slug, props.slug])

    // Initialize an array of current uncap values for each summon
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}

        if (state.grid.summons.mainSummon) 
            initialPreviousUncapValues[-1] = state.grid.summons.mainSummon.uncap_level

        if (state.grid.summons.friendSummon) 
            initialPreviousUncapValues[6] = state.grid.summons.friendSummon.uncap_level

        Object.values(state.grid.summons.allSummons).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)

        setPreviousUncapValues(initialPreviousUncapValues)
    }, [state.grid.summons.mainSummon, state.grid.summons.friendSummon, state.grid.summons.allSummons])


    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'summons' })
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
            state.party.editable = true
        }
        
        // Store the important party and state-keeping values
        state.party.id = party.id

        setFound(true)
        setLoading(false)

        // Populate the weapons in state
        populateSummons(party.summons)
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

    function populateSummons(list: [GridSummon]) {
        list.forEach((gridObject: GridSummon) => {
            if (gridObject.main)
                state.grid.summons.mainSummon = gridObject
            else if (gridObject.friend)
                state.grid.summons.friendSummon = gridObject
            else if (!gridObject.main && !gridObject.friend && gridObject.position != null)
                state.grid.summons.allSummons[gridObject.position] = gridObject
        })
    }

    // Methods: Adding an object from search
    function receiveSummonFromSearch(object: Character | Weapon | Summon, position: number) {
        const summon = object as Summon

        if (!party.id) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    state.party.id = party.id
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)

                    saveSummon(party.id, summon, position)
                        .then(response => storeGridSummon(response.data.grid_summon))
                })
        } else {
            saveSummon(party.id, summon, position)
                .then(response => storeGridSummon(response.data.grid_summon))
        }
    }

    async function saveSummon(partyId: string, summon: Summon, position: number) {
        let uncapLevel = 3
        if (summon.uncap.ulb) uncapLevel = 5
        else if (summon.uncap.flb) uncapLevel = 4
        
        return await api.endpoints.summons.create({
            'summon': {
                'party_id': partyId,
                'summon_id': summon.id,
                'position': position,
                'main': (position == -1),
                'friend': (position == 6),
                'uncap_level': uncapLevel
            }
        }, headers)
    }

    function storeGridSummon(gridSummon: GridSummon) {
        if (gridSummon.position == -1)
            state.grid.summons.mainSummon = gridSummon
        else if (gridSummon.position == 6)
            state.grid.summons.friendSummon = gridSummon
        else
            state.grid.summons.allSummons[gridSummon.position] = gridSummon
    }

    // Methods: Updating uncap level
    // Note: Saves, but debouncing is not working properly
    async function saveUncap(id: string, position: number, uncapLevel: number) {
        storePreviousUncapValue(position)

        try {
            if (uncapLevel != previousUncapValues[position])
                await api.updateUncap('summon', id, uncapLevel)
                    .then(response => { storeGridSummon(response.data.grid_summon) })
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
        if (state.grid.summons.mainSummon && position == -1)
            state.grid.summons.mainSummon.uncap_level = uncapLevel
        else if (state.grid.summons.friendSummon && position == 6) 
            state.grid.summons.friendSummon.uncap_level = uncapLevel
        else
            state.grid.summons.allSummons[position].uncap_level = uncapLevel
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}

        if (state.grid.summons.mainSummon && position == -1) newPreviousValues[position] = state.grid.summons.mainSummon.uncap_level
        else if (state.grid.summons.friendSummon && position == 6) newPreviousValues[position] = state.grid.summons.friendSummon.uncap_level 
        else newPreviousValues[position] = state.grid.summons.allSummons[position].uncap_level

        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    const mainSummonElement = (
        <div className="LabeledUnit">
            <div className="Label">Main Summon</div>
            <SummonUnit
                gridSummon={grid.summons.mainSummon}
                editable={party.editable}
                key="grid_main_summon"
                position={-1}
                unitType={0}
                updateObject={receiveSummonFromSearch}
                updateUncap={initiateUncapUpdate}
            />
        </div>
    )

    const friendSummonElement = (
        <div className="LabeledUnit">
            <div className="Label">Friend Summon</div>
            <SummonUnit
                gridSummon={grid.summons.friendSummon}
                editable={party.editable}
                key="grid_friend_summon"
                position={6}
                unitType={2}
                updateObject={receiveSummonFromSearch}
                updateUncap={initiateUncapUpdate}
            />
        </div>
    )
    const summonGridElement = (
        <div id="LabeledGrid">
            <div className="Label">Summons</div>
            <ul id="grid_summons">
                {Array.from(Array(numSummons)).map((x, i) => {
                    return (<li key={`grid_unit_${i}`} >
                        <SummonUnit 
                            gridSummon={grid.summons.allSummons[i]}
                            editable={party.editable}
                            position={i} 
                            unitType={1}
                            updateObject={receiveSummonFromSearch}
                            updateUncap={initiateUncapUpdate}
                        />
                    </li>)
                })}
            </ul>
        </div>
    )
    const subAuraSummonElement = (
        <ExtraSummons 
            grid={grid.summons.allSummons} 
            editable={party.editable} 
            exists={false} 
            offset={numSummons}
            updateObject={receiveSummonFromSearch}
            updateUncap={initiateUncapUpdate}
        />
    )
    return (
        <div>
            <div id="SummonGrid">
                { mainSummonElement }
                { friendSummonElement }
                { summonGridElement }
            </div>
            
            { subAuraSummonElement }
        </div>
    )
}

export default SummonGrid
