import React, { useEffect, useState } from 'react'
import api from '~utils/api'

import WeaponUnit from '~components/WeaponUnit/WeaponUnit'
import Button from '~components/Button/Button'

import './WeaponGrid.css'

interface Props {
    userId: string
    partyId: string
    mainhand: Weapon | undefined
    grid: GridArray
    editable: boolean
    exists: boolean
    found: boolean
}

type GridArray = { [key: number]: Weapon }

const WeaponGrid = (props: Props) => {
    const numWeapons: number = 9

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})

    useEffect(() => {
        if (props.exists && props.found)
            configure()
    }, [props.mainhand, props.grid])

    function configure() {
        setMainhand(props.mainhand)
        setWeapons(props.grid)
    }

    function createParty() {
        const body = (props.userId === '') ? {} : {
            party: {
                user_id: props.userId
            }
        }

        return api.endpoints.parties.create(body)
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
        
        if (props.partyId == undefined) {
            createParty()
                .then(response => {
                    return response.data.party
                })
                .then(party => {                    
                    window.history.replaceState(null, `Grid Tool`, `/p/${party.shortcode}`)

                    return party.id
                })
                .then(partyId => {
                    saveWeapon(partyId, weapon, position)
                })
        } else {
            saveWeapon(props.partyId, weapon, position)
        }
    }

    function saveWeapon(pid: string, weapon: Weapon, position: number) {
        const body = {
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': (position == -1)
            }
        }

        api.endpoints.weapons.create(body)
    }

    function renderGrid() {
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

    function renderGridNotFound() {
        return (
            <div id="NotFound">
                <h2>There's no grid here.</h2>
                <Button type="new">New grid</Button>
            </div>
        )
    }

    return (props.found) ? renderGrid() : renderGridNotFound()
}

export default WeaponGrid
