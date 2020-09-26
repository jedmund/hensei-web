import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

import WeaponUnit from '~components/WeaponUnit'
import Button from '~components/Button'

import './index.css'

interface Props {
    userId?: string
    partyId?: string
    mainhand?: Weapon | undefined
    grid?: GridArray
    editable: boolean
    exists: boolean
    found?: boolean
    pushHistory?: (path: string) => void
}

type GridArray = { [key: number]: Weapon }

const WeaponGrid = (props: Props) => {
    const numWeapons: number = 9

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})
    const [partyId, setPartyId] = useState('')

    const [cookies, setCookie] = useCookies(['user'])

    useEffect(() => {
        if (props.exists && props.found)
            configure()
    }, [props.mainhand, props.grid, props.partyId])

    function configure() {
        setMainhand(props.mainhand)
        setWeapons(props.grid || {})
        setPartyId(props.partyId || '')
    }

    function createParty() {
        const headers = (cookies.user != null) ? {
            headers: {
                'Authorization': `Bearer ${cookies.user.access_token}`
            }
        } : {}

        const body = (props.userId === undefined) ? {} : {
            party: {
                user_id: props.userId
            }
        }

        return api.endpoints.parties.create(body, headers)
    }

    function receiveWeapon(weapon: Weapon, position: number) {
        const isMainhand = position == -1

        if (isMainhand) {
            setMainhand(weapon)
        } else {
            // Store the grid unit weapon at the correct position
            let newWeapons = Object.assign({}, weapons)
            newWeapons[position] = weapon
            setWeapons(newWeapons)
        }

        if (partyId) {
            saveWeapon(partyId, weapon, position)
        } else {
            createParty()
                .then(response => {
                    return response.data.party
                })
                .then(party => {
                    if (props.pushHistory) {   
                        props.pushHistory(`/p/${party.shortcode}`)
                    }

                    return party.id
                })
                .then(partyId => {
                    saveWeapon(partyId, weapon, position)
                    setPartyId(partyId)
                })
        }
    }

    function saveWeapon(pid: string, weapon: Weapon, position: number) {
        const headers = (cookies.user != null) ? {
            headers: {
                'Authorization': `Bearer ${cookies.user.access_token}`
            }
        } : {}

        const body = {
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': (position == -1)
            }
        }

        api.endpoints.weapons.create(body, headers)
    }

    return (
        <div className="WeaponGrid">
            <WeaponUnit 
                editable={props.editable}
                key="grid_mainhand"
                onReceiveData={receiveWeapon} 
                position={-1} 
                unitType={0}
                weapon={mainhand}
            />

            <ul id="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return (
                            <li key={`grid_unit_${i}`} >
                                <WeaponUnit 
                                    editable={props.editable}
                                    onReceiveData={receiveWeapon} 
                                    position={i} 
                                    unitType={1}
                                    weapon={weapons[i]}
                                />
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default WeaponGrid
