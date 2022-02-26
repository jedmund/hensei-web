/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useSnapshot } from 'valtio'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

import api from '~utils/api'
import { appState } from '~utils/appState'

import './index.scss'

// Props
interface Props {
    slug?: string
    createParty: (extra: boolean) => Promise<AxiosResponse<any, any>>
    pushHistory?: (path: string) => void
}

const WeaponGrid = (props: Props) => {
    // Constants
    const numWeapons: number = 9

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

    // Create a temporary state to store previous weapon uncap values
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : slug
        if (shortcode) fetchGrid(shortcode)
        else appState.party.editable = true
    }, [slug, props.slug])

    // Initialize an array of current uncap values for each weapon
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}

        if (appState.grid.weapons.mainWeapon) 
            initialPreviousUncapValues[-1] = appState.grid.weapons.mainWeapon.uncap_level

        Object.values(appState.grid.weapons.allWeapons).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)

        setPreviousUncapValues(initialPreviousUncapValues)
    }, [appState.grid.weapons.mainWeapon, appState.grid.weapons.allWeapons])

    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'weapons' })
            .then(response => processResult(response))
            .catch(error => processError(error))
    }

    function processResult(response: AxiosResponse) {
        console.log("Retrieved data from server...")

        // Store the response
        const party = response.data.party
            
        // Get the party user and logged in user, if possible, to compare
        const partyUser = (party.user_id) ? party.user_id : undefined
        const loggedInUser = (cookies.user) ? cookies.user.user_id : ''

        if (partyUser != undefined && loggedInUser != undefined && partyUser === loggedInUser) {
            appState.party.editable = true
        }
        
        // Store the important party and state-keeping values
        appState.party.id = party.id
        appState.party.extra = party.is_extra

        setFound(true)
        setLoading(false)

        // Populate the weapons in state
        populateWeapons(party.weapons)
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

    function populateWeapons(list: [GridWeapon]) {
        list.forEach((gridObject: GridWeapon) => {
            if (gridObject.mainhand) {
                appState.grid.weapons.mainWeapon = gridObject
                appState.party.element = gridObject.object.element
            } else if (!gridObject.mainhand && gridObject.position != null) {
                appState.grid.weapons.allWeapons[gridObject.position] = gridObject
            }
        })
    }
    
    // Methods: Adding an object from search
    function receiveWeaponFromSearch(object: Character | Weapon | Summon, position: number) {
        const weapon = object as Weapon
        if (position == 1)
            appState.party.element = weapon.element

        if (!party.id) {
            props.createParty(party.extra)
                .then(response => {
                    const party = response.data.party
                    appState.party.id = party.id
                    setSlug(party.shortcode)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)

                    saveWeapon(party.id, weapon, position)
                        .then(response => storeGridWeapon(response.data.grid_weapon))
                })
        } else {
            saveWeapon(party.id, weapon, position)
                .then(response => storeGridWeapon(response.data.grid_weapon))
        }
    }

    async function saveWeapon(partyId: string, weapon: Weapon, position: number) {
        let uncapLevel = 3
        if (weapon.uncap.ulb) uncapLevel = 5
        else if (weapon.uncap.flb) uncapLevel = 4
        
        return await api.endpoints.weapons.create({
            'weapon': {
                'party_id': partyId,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': (position == -1),
                'uncap_level': uncapLevel
            }
        }, headers)
    }

    function storeGridWeapon(gridWeapon: GridWeapon) {
        if (gridWeapon.position == -1) {
            appState.grid.weapons.mainWeapon = gridWeapon
            appState.party.element = gridWeapon.object.element
        } else {
            // Store the grid unit at the correct position
            appState.grid.weapons.allWeapons[gridWeapon.position] = gridWeapon
        }
    }

    // Methods: Updating uncap level
    // Note: Saves, but debouncing is not working properly
    async function saveUncap(id: string, position: number, uncapLevel: number) {
        storePreviousUncapValue(position)

        try {
            if (uncapLevel != previousUncapValues[position])
                await api.updateUncap('weapon', id, uncapLevel)
                    .then(response => { storeGridWeapon(response.data.grid_weapon) })
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
        if (appState.grid.weapons.mainWeapon && position == -1)
            appState.grid.weapons.mainWeapon.uncap_level = uncapLevel
        else
            appState.grid.weapons.allWeapons[position].uncap_level = uncapLevel
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}
        newPreviousValues[position] = (appState.grid.weapons.mainWeapon && position == -1) ? 
            appState.grid.weapons.mainWeapon.uncap_level : appState.grid.weapons.allWeapons[position].uncap_level
        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    const mainhandElement = (
        <WeaponUnit 
            gridWeapon={grid.weapons.mainWeapon}
            editable={party.editable}
            key="grid_mainhand"
            position={-1} 
            unitType={0}
            updateObject={receiveWeaponFromSearch}
            updateUncap={initiateUncapUpdate}
        />
    )

    const weaponGridElement = (
        Array.from(Array(numWeapons)).map((x, i) => {
            return (
                <li key={`grid_unit_${i}`} >
                    <WeaponUnit 
                        gridWeapon={grid.weapons.allWeapons[i]}
                        editable={party.editable}
                        position={i} 
                        unitType={1}
                        updateObject={receiveWeaponFromSearch}
                        updateUncap={initiateUncapUpdate}
                    />
                </li>
            )
        })
    )

    const extraGridElement = (
        <ExtraWeapons 
            grid={grid.weapons.allWeapons} 
            editable={party.editable} 
            offset={numWeapons}
            updateObject={receiveWeaponFromSearch}
            updateUncap={initiateUncapUpdate}
        />
    )
    
    return (
        <div id="WeaponGrid">
            <div id="MainGrid">
                { mainhandElement }
                <ul className="grid_weapons">{ weaponGridElement }</ul>
            </div>

            { (() => { return (party.extra) ? extraGridElement : '' })() }
        </div>
    )
}

export default WeaponGrid
