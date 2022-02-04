/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useModal as useModal } from '~utils/useModal'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import AppContext from '~context/AppContext'
import PartyContext from '~context/PartyContext'

import SearchModal from '~components/SearchModal'
import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

import api from '~utils/api'
import './index.scss'
import Party from '~components/Party'

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
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    
    // Set up the party context
    const { setEditable: setAppEditable } = useContext(AppContext)
    const { id, setId } = useContext(PartyContext)
    const { editable, setEditable } = useContext(PartyContext)
    const { hasExtra, setHasExtra } = useContext(PartyContext)
    const { setElement } = useContext(PartyContext)

    // Set up states for Grid data
    const [weapons, setWeapons] = useState<GridArray<GridWeapon>>({})
    const [mainWeapon, setMainWeapon] = useState<GridWeapon>()

    // Set up states for Search
    const { open, openModal, closeModal } = useModal()
    const [itemPositionForSearch, setItemPositionForSearch] = useState(0)

    // Create a temporary state to store previous weapon uncap values
    const [previousUncapValues, setPreviousUncapValues] = useState<{[key: number]: number}>({})

    // Create a state dictionary to store pure objects for Search
    const [searchGrid, setSearchGrid] = useState<GridArray<Weapon>>({})

    // Fetch data from the server
    useEffect(() => {
        if (props.slug) fetchGrid(props.slug)
        else {
            setEditable(true)
            setAppEditable(true)
        }
    }, [props.slug])

    // Initialize an array of current uncap values for each weapon
    useEffect(() => {
        let initialPreviousUncapValues: {[key: number]: number} = {}
        if (mainWeapon) initialPreviousUncapValues[-1] = mainWeapon.uncap_level
        Object.values(weapons).map(o => initialPreviousUncapValues[o.position] = o.uncap_level)
        setPreviousUncapValues(initialPreviousUncapValues)
    }, [mainWeapon, weapons])

    // Update search grid whenever weapons or the mainhand are updated
    useEffect(() => {
        let newSearchGrid = Object.values(weapons).map((o) => o.weapon)

        if (mainWeapon)
            newSearchGrid.unshift(mainWeapon.weapon)

        setSearchGrid(newSearchGrid)
    }, [weapons, mainWeapon])

    // Methods: Fetching an object from the server
    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOneWithObject({ id: shortcode, object: 'weapons' })
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
            setAppEditable(true)
        }
        
        // Store the important party and state-keeping values
        setId(party.id)
        setHasExtra(party.is_extra)
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
        let weapons: GridArray<GridWeapon> = {}

        list.forEach((object: GridWeapon) => {
            if (object.mainhand) {
                setMainWeapon(object)
                setElement(object.weapon.element)
            } else if (!object.mainhand && object.position != null) {
                weapons[object.position] = object
            }
        })

        setWeapons(weapons)
    }

    // Methods: Adding an object from search
    function openSearchModal(position: number) {
        setItemPositionForSearch(position)
        openModal()
    }

    function receiveWeaponFromSearch(object: Character | Weapon | Summon, position: number) {
        const weapon = object as Weapon
        setElement(weapon.element)

        if (!id) {
            props.createParty(hasExtra)
                .then(response => {
                    const party = response.data.party
                    setId(party.id)

                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveWeapon(party.id, weapon, position)
                        .then(response => storeGridWeapon(response.data.grid_weapon))
                })
        } else {
            saveWeapon(id, weapon, position)
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
            setMainWeapon(gridWeapon)
        } else {
            // Store the grid unit at the correct position
            let newWeapons = Object.assign({}, weapons)
            newWeapons[gridWeapon.position] = gridWeapon
            setWeapons(newWeapons)
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
        if (mainWeapon && position == -1) {
            mainWeapon.uncap_level = uncapLevel
            setMainWeapon(mainWeapon)
        } else {
            let newWeapons = Object.assign({}, weapons)
            newWeapons[position].uncap_level = uncapLevel
            setWeapons(newWeapons)
        }
    }

    function storePreviousUncapValue(position: number) {
        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}
        newPreviousValues[position] = (mainWeapon && position == -1) ? mainWeapon.uncap_level : weapons[position].uncap_level
        setPreviousUncapValues(newPreviousValues)
    }

    // Render: JSX components
    const mainhandElement = (
        <WeaponUnit 
            gridWeapon={mainWeapon}
            editable={editable}
            key="grid_mainhand"
            position={-1} 
            unitType={0}
            onClick={() => { openSearchModal(-1) }}
            updateUncap={initiateUncapUpdate}
        />
    )

    const weaponGridElement = (
        Array.from(Array(numWeapons)).map((x, i) => {
            return (
                <li key={`grid_unit_${i}`} >
                    <WeaponUnit 
                        gridWeapon={weapons[i]}
                        editable={editable}
                        position={i} 
                        unitType={1}
                        onClick={() => { openSearchModal(i) }}
                        updateUncap={initiateUncapUpdate}
                    />
                </li>
            )
        })
    )

    const extraGridElement = (
        <ExtraWeapons 
            grid={weapons} 
            editable={editable} 
            offset={numWeapons}
            onClick={openSearchModal}
            updateUncap={initiateUncapUpdate}
        />
    )
    
    return (
        <div id="WeaponGrid">
            <div id="MainGrid">
                { mainhandElement }
                <ul className="grid_weapons">{ weaponGridElement }</ul>
            </div>

            { (() => { return (hasExtra) ? extraGridElement : '' })() }

            {open ? (
                <SearchModal 
                    grid={searchGrid}
                    close={closeModal}
                    send={receiveWeaponFromSearch}
                    fromPosition={itemPositionForSearch}
                    object="weapons"
                    placeholderText="Search for a weapon..."
                />
            ) : null}
        </div>
    )
}

export default WeaponGrid
