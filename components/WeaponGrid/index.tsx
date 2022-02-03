/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useModal as useModal } from '~utils/useModal'

import { AxiosResponse } from 'axios'
import debounce from 'lodash.debounce'

import SearchModal from '~components/SearchModal'
import WeaponUnit from '~components/WeaponUnit'
import ExtraWeapons from '~components/ExtraWeapons'

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
    mainhand: GridWeapon | undefined
    weapons: GridArray<GridWeapon>
    extra: boolean
    editable: boolean
    createParty: () => Promise<AxiosResponse<any, any>>
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

    // Set states from props
    useEffect(() => {
        setWeapons(props.weapons || {})
        setMainWeapon(props.mainhand)
    }, [props])

    // Update search grid whenever weapons or the mainhand are updated
    useEffect(() => {
        let newSearchGrid = Object.values(weapons).map((o) => o.weapon)

        if (mainWeapon)
            newSearchGrid.unshift(mainWeapon.weapon)

        setSearchGrid(newSearchGrid)
    }, [weapons, mainWeapon])

    // Methods: Adding an object from search
    function openSearchModal(position: number) {
        setItemPositionForSearch(position)
        openModal()
    }

    function receiveWeaponFromSearch(object: Character | Weapon | Summon, position: number) {
        const weapon = object as Weapon

        if (!props.partyId) {
            props.createParty()
                .then(response => {
                    const party = response.data.party
                    if (props.pushHistory) props.pushHistory(`/p/${party.shortcode}`)
                    saveWeapon(party.id, weapon, position)
                        .then(response => storeGridWeapon(response.data.grid_weapon))
                })
        } else {
            saveWeapon(props.partyId, weapon, position)
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
            let newWeapons = Object.assign({}, props.weapons)
            newWeapons[gridWeapon.position] = gridWeapon
            setWeapons(newWeapons)
        }
    }

    // Methods: Updating uncap level
    // Note: Saves, but debouncing is not working properly
    async function saveUncap(id: string, position: number, uncapLevel: number) {
        // TODO: Don't make an API call if the new uncapLevel is the same as the current uncapLevel
        try {
            await api.updateUncap('weapon', id, uncapLevel)
                .then(response => {
                    storeGridWeapon(response.data.grid_weapon)
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

    function initiateUncapUpdate(id: string, position: number, uncapLevel: number) {
        memoizeAction(id, position, uncapLevel)

        // Save the current value in case of an unexpected result
        let newPreviousValues = {...previousUncapValues}
        newPreviousValues[position] = (mainWeapon && position == -1) ? mainWeapon.uncap_level : weapons[position].uncap_level
        setPreviousUncapValues(newPreviousValues)

        // Optimistically update UI
        updateUncapLevel(position, uncapLevel)
    }

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
        if (mainWeapon && position == -1) {
            mainWeapon.uncap_level = uncapLevel
            setMainWeapon(mainWeapon)
        } else {
            let newWeapons = Object.assign({}, props.weapons)
            newWeapons[position].uncap_level = uncapLevel
            setWeapons(newWeapons)
        }
    }

    // Render: JSX components
    const mainhandElement = (
        <WeaponUnit 
            gridWeapon={mainWeapon}
            editable={props.editable}
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
                        editable={props.editable}
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
            editable={props.editable} 
            offset={numWeapons}
            onClick={openSearchModal}
            updateUncap={initiateUncapUpdate}
        />
    )
    
    return (
        <div id="weapon_grids">
            <div id="WeaponGrid">
                { mainhandElement }
                <ul id="grid_weapons">{ weaponGridElement }</ul>
            </div>

            { (() => { return (props.extra) ? extraGridElement : '' })() }

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
