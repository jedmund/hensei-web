/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import SummonUnit from '~components/SummonUnit'
import ExtraSummons from '~components/ExtraSummons'

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

const SummonGrid = (props: Props) => {
    // Constants
    const numSummons: number = 4

    const { t } = useTranslation('common')

    // Cookies
    const [cookies, _] = useCookies(['account'])
    const headers = (cookies.account != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.account.access_token}`
        }
    } : {}

    // Set up state for view management
    const { party, grid } = useSnapshot(appState)

    const [slug, setSlug] = useState()
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [firstLoadComplete, setFirstLoadComplete] = useState(false)

    // Create a temporary state to store previous weapon uncap value
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
            if ((cookies.account && party.user && cookies.account.user_id === party.user.id) || props.new)
                appState.party.editable = true
            else            
                appState.party.editable = false

            setFirstLoadComplete(true)
        }
    }, [props.new, cookies, party, loading, firstLoadComplete])

    // Initialize an array of current uncap values for each summon
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}

        if (appState.grid.summons.mainSummon) 
            initialPreviousUncapValues[-1] = appState.grid.summons.mainSummon.uncap_level

        if (appState.grid.summons.friendSummon) 
            initialPreviousUncapValues[6] = appState.grid.summons.friendSummon.uncap_level

        Object.values(appState.grid.summons.allSummons).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)

        setPreviousUncapValues(initialPreviousUncapValues)
    }, [appState.grid.summons.mainSummon, appState.grid.summons.friendSummon, appState.grid.summons.allSummons])


    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'summons', params: headers })
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

    function populateSummons(list: Array<GridSummon>) {
        list.forEach((gridObject: GridSummon) => {
            if (gridObject.main)
                appState.grid.summons.mainSummon = gridObject
            else if (gridObject.friend)
                appState.grid.summons.friendSummon = gridObject
            else if (!gridObject.main && !gridObject.friend && gridObject.position != null)
                appState.grid.summons.allSummons[gridObject.position] = gridObject
        })
    }

    // Methods: Adding an object from search
    function receiveSummonFromSearch(object: Character | Weapon | Summon, position: number) {
        const summon = object as Summon

        if (!party.id) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    appState.party.id = party.id
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)

                    saveSummon(party.id, summon, position)
                        .then(response => storeGridSummon(response.data.grid_summon))
                })
        } else {
            if (party.editable)
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
            appState.grid.summons.mainSummon = gridSummon
        else if (gridSummon.position == 6)
            appState.grid.summons.friendSummon = gridSummon
        else
            appState.grid.summons.allSummons[gridSummon.position] = gridSummon
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
        if (appState.grid.summons.mainSummon && position == -1)
            appState.grid.summons.mainSummon.uncap_level = uncapLevel
        else if (appState.grid.summons.friendSummon && position == 6) 
            appState.grid.summons.friendSummon.uncap_level = uncapLevel
        else
            appState.grid.summons.allSummons[position].uncap_level = uncapLevel
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}

        if (appState.grid.summons.mainSummon && position == -1) newPreviousValues[position] = appState.grid.summons.mainSummon.uncap_level
        else if (appState.grid.summons.friendSummon && position == 6) newPreviousValues[position] = appState.grid.summons.friendSummon.uncap_level 
        else newPreviousValues[position] = appState.grid.summons.allSummons[position].uncap_level

        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    const mainSummonElement = (
        <div className="LabeledUnit">
            <div className="Label">{t('summons.main')}</div>
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
            <div className="Label">{t('summons.friend')}</div>
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
            <div className="Label">{t('summons.summons')}</div>
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
