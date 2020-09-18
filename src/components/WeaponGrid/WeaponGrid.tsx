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

type GridArray = { [key: number]: Weapon } 

const WeaponGrid = (props: {}) => {
    const [partyId, setPartyId] = useState<string>()
    const [shortcode, setShortcode] = useState<string>()

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})

    const numWeapons: number = 9

    useEffect(() => {
        const shortcode = props.match.params.hash

        if (shortcode) {
            fetchGrid(shortcode)
        } else {
            // There is no need to fetch a weapon
        }
    }, [])

    function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOne({ id: shortcode })
            .then(response => {
                const grid = response.data.party.grid

                let weapons: GridArray = {}
                grid.forEach((gridWeapon: GridWeapon) => {
                    if (gridWeapon.mainhand) {
                        setMainhand(gridWeapon.weapon)
                    } 
                    
                    else if (!gridWeapon.mainhand && gridWeapon.position != null) {
                        weapons[gridWeapon.position] = gridWeapon.weapon
                    }
                })

                setWeapons(weapons)
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
            <WeaponGridMainhand key="grid_mainhand" onReceiveData={receiveMainhand} position={0} weapon={mainhand} />

            <ul id="grid_weapons">
                {
                    Array.from(Array(numWeapons)).map((x, i) => {
                        return <WeaponGridUnit key={`grid_unit_${i}`} onReceiveData={receiveWeapon} position={i} weapon={weapons[i]} />
                    })
                }
            </ul>
        </div>
    )
}

export default withRouter(WeaponGrid)
