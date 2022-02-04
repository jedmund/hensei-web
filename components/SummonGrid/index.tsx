/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useModal as useModal } from '~utils/useModal'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import AppContext from '~context/AppContext'
import PartyContext from '~context/PartyContext'

import SearchModal from '~components/SearchModal'
import SummonUnit from '~components/SummonUnit'
import ExtraSummons from '~components/ExtraSummons'

import api from '~utils/api'
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
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const { id, setId } = useContext(PartyContext)
    const { slug, setSlug } = useContext(PartyContext)
    const { editable, setEditable } = useContext(AppContext)

    // Set up states for Grid data
    const [summons, setSummons] = useState<GridArray<GridSummon>>({})
    const [mainSummon, setMainSummon] = useState<GridSummon>()
    const [friendSummon, setFriendSummon] = useState<GridSummon>()

    // Set up states for Search
    const { open, openModal, closeModal } = useModal()
    const [itemPositionForSearch, setItemPositionForSearch] = useState(0)

    // Create a temporary state to store previous weapon uncap value
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Create a state dictionary to store pure objects for Search
    const [searchGrid, setSearchGrid] = useState<GridArray<Summon>>({})

    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : slug
        if (shortcode) fetchGrid(shortcode)
        else setEditable(true)
    }, [slug, props.slug])

    // Initialize an array of current uncap values for each summon
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}
        if (mainSummon) initialPreviousUncapValues[-1] = mainSummon.uncap_level
        if (friendSummon) initialPreviousUncapValues[6] = friendSummon.uncap_level
        Object.values(summons).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)
        setPreviousUncapValues(initialPreviousUncapValues)
    }, [summons, mainSummon, friendSummon])

    // Update search grid whenever any summon is updated
    useEffect(() => {
        let newSearchGrid = Object.values(summons).map((o) => o.summon)

        if (mainSummon)
            newSearchGrid.unshift(mainSummon.summon)

        if (friendSummon)
            newSearchGrid.unshift(friendSummon.summon)

        setSearchGrid(newSearchGrid)
    }, [summons, mainSummon, friendSummon])

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
            setEditable(true)
        }
        
        // Store the important party and state-keeping values
        setId(party.id)
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
        let summons: GridArray<GridSummon> = {}

        list.forEach((object: GridSummon) => {
            if (object.main)
                setMainSummon(object)
            else if (object.friend)
                setFriendSummon(object)
            else if (!object.main && !object.friend && object.position != null)
                summons[object.position] = object
        })

        setSummons(summons)
    }

    // Methods: Adding an object from search
    function openSearchModal(position: number) {
        setItemPositionForSearch(position)
        openModal()
    }

    function receiveSummonFromSearch(object: Character | Weapon | Summon, position: number) {
        const summon = object as Summon

        if (!id) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    setId(party.id)
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveSummon(party.id, summon, position)
                        .then(response => storeGridSummon(response.data.grid_summon))
                })
        } else {
            saveSummon(id, summon, position)
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
        if (gridSummon.position == -1) {
            setMainSummon(gridSummon)
        } else if (gridSummon.position == 6) {
            setFriendSummon(gridSummon)
        } else {
            // Store the grid unit at the correct position
            let newSummons = Object.assign({}, summons)
            newSummons[gridSummon.position] = gridSummon
            setSummons(newSummons)
        }
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

    const initiateUncapUpdate = useCallback(
        (id: string, position: number, uncapLevel: number) => {
            memoizeAction(id, position, uncapLevel)

            // Optimistically update UI
            updateUncapLevel(position, uncapLevel)
        }, [previousUncapValues, summons]
    )

    const memoizeAction = useCallback(
        (id: string, position: number, uncapLevel: number) => {
            debouncedAction(id, position, uncapLevel)
        }, [summons, mainSummon, friendSummon]
    )

    const debouncedAction = useMemo(() =>
        debounce((id, position, number) => {
            saveUncap(id, position, number)
        }, 500), [summons, mainSummon, friendSummon, saveUncap]
    )

    const updateUncapLevel = (position: number, uncapLevel: number) => {
        let newSummons = Object.assign({}, summons)
        newSummons[position].uncap_level = uncapLevel
        setSummons(newSummons)
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}

        if (mainSummon && position == -1) newPreviousValues[position] = mainSummon.uncap_level
        else if (friendSummon && position == 6) newPreviousValues[position] = friendSummon.uncap_level 
        else newPreviousValues[position] = summons[position].uncap_level

        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    const mainSummonElement = (
        <div className="LabeledUnit">
            <div className="Label">Main Summon</div>
            <SummonUnit
                gridSummon={mainSummon}
                editable={editable}
                key="grid_main_summon"
                position={-1}
                unitType={0}
                onClick={() => { openSearchModal(-1) }}
                updateUncap={initiateUncapUpdate}
            />
        </div>
    )

    const friendSummonElement = (
        <div className="LabeledUnit">
            <div className="Label">Friend Summon</div>
            <SummonUnit
                gridSummon={friendSummon}
                editable={editable}
                key="grid_friend_summon"
                position={6}
                unitType={2}
                onClick={() => { openSearchModal(6) }}
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
                            gridSummon={summons[i]}
                            editable={editable}
                            position={i} 
                            unitType={1}
                            onClick={() => { openSearchModal(i) }}
                            updateUncap={initiateUncapUpdate}
                        />
                    </li>)
                })}
            </ul>
        </div>
    )
    const subAuraSummonElement = (
        <ExtraSummons 
            grid={summons} 
            editable={editable} 
            exists={false} 
            offset={numSummons}
            onClick={openSearchModal}
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

            {open ? (
                <SearchModal 
                    grid={searchGrid}
                    close={closeModal}
                    send={receiveSummonFromSearch}
                    fromPosition={itemPositionForSearch}
                    object="summons"
                    placeholderText="Search for a summon..."
                />
            ) : null}
        </div>
    )
}

export default SummonGrid
