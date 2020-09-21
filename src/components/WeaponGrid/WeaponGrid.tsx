import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router'
import api from '~utils/api'

import WeaponGridMainhand from '~components/WeaponGridMainhand/WeaponGridMainhand'
import WeaponGridUnit from '~components/WeaponGridUnit/WeaponGridUnit'

import './WeaponGrid.css'

interface GridWeapon {
    id: string
    mainhand: boolean
    position: number | null
    weapon: Weapon
}

interface Props {
    shortcode: string
    editable: boolean
}

type GridArray = { [key: number]: Weapon } 

const WeaponGrid = (props: Props) => {
    const [partyId, setPartyId] = useState<string>()
    const [shortcode, setShortcode] = useState<string>()

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})

    const numWeapons: number = 9

    useEffect(() => {
        if (props.shortcode) {
            fetchGrid(props.shortcode)
        } else {
            setIsValid(true)
        }
    }, [])

    function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOne({ id: shortcode })
            .then(response => {
                setupGrid(response)
            })
            .catch(error => {
                if (error.response.status == 404) {
                    gridNotFound()
                }
            })
    }

    function receiveMainhand(weapon: Weapon, _: number) {
        // Store the mainhand weapon
        setMainhand(weapon)

        if (partyId === undefined) {
            let _partyId = ''

            createParty().then(response => {
                const party = response.data.party

                setPartyId(party.id)
                _partyId = party.id

                return party.shortcode
            })
            .then((code: string) => {
                setShortcode(shortcode)
                window.history.replaceState(null, `Grid Tool: ${code}`, `/p/${code}`)
            })
            .then(() => {
                saveMainhand(_partyId, weapon)
            })
        } else {
            saveMainhand(partyId, weapon)
        }
    }

    function receiveWeapon(weapon: Weapon, position: number) {
        // Store the grid unit weapon at the correct position
        let newWeapons = Object.assign({}, weapons)
        newWeapons[position] = weapon
        setWeapons(newWeapons)

        if (partyId === undefined) {
            let _partyId = ''

            createParty().then(response => {
                const party = response.data.party
                setPartyId(party.id)
                _partyId = party.id 

                return party.shortcode
            })
            .then((code: string) => {
                setShortcode(shortcode)
                window.history.replaceState(null, `Grid Tool: ${code}`, `/p/${code}`)
            })
            .then(() => {
                saveWeapon(_partyId, weapon, position)
            })
        } else {
            saveWeapon(partyId, weapon, position)
        }
    }

    function createParty() {
        return api.endpoints.parties.create({})
    }

    function saveWeapon(pid: string, weapon: Weapon, position: number) {
        const body = {
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': false
            }
        }

        api.endpoints.weapons.create(body)
    }

    function saveMainhand(pid: string, weapon: Weapon) {
        const body = {
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'mainhand': true
            }
        }

        api.endpoints.weapons.create(body)
    }

    return (
        <div className="WeaponGrid">
            <WeaponGridMainhand 
                editable={props.editable}
                key="grid_mainhand" 
                onReceiveData={receiveMainhand} 
                position={0} 
                weapon={mainhand}
            />

            <ul id="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return <WeaponGridUnit 
                            editable={props.editable}
                            key={`grid_unit_${i}`} 
                            onReceiveData={receiveWeapon} 
                            position={i} 
                            weapon={weapons[i]}
                        />
                    })
                }
            </ul>
        </div>
    )
}

export default withRouter(WeaponGrid)
