import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router'

import WeaponGridMainhand from 'components/WeaponGridMainhand/WeaponGridMainhand'
import WeaponGridUnit from 'components/WeaponGridUnit/WeaponGridUnit'

import './WeaponGrid.css'

interface GridWeapon {
    id: string
    mainhand: boolean
    position: number | null
    weapon: Weapon
}

type GridArray = { [key: number]: Weapon } 

const endpoint = process.env.SIERO_API ? process.env.SIERO_API : 'http://127.0.0.1:3000/api/v1'

const WeaponGrid = (props: null) => {
    const [partyId, setPartyId] = useState<string>()
    const [shortcode, setShortcode] = useState<string>()

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<GridArray>({})

    const numWeapons: number = 9

    useEffect(() => {
        const shortcode = props.match.params.hash

        if (shortcode) {
            fetchGrid(shortcode)
            console.log(shortcode)
        } else {
            console.log('nothing')
        }
    }, [])

    function fetchGrid(shortcode: string) {
        const options = {
            headers: { 'Content-Type': 'application/json' },
            method: 'GET'
        }

        return fetch(`${endpoint}/party/${shortcode}`, options)
            .then(response => response.json())
            .then(data => {
                const grid = data.party.grid

                const mainhand = grid.filter((gridWeapon: GridWeapon) => gridWeapon.mainhand)[0].weapon
                setMainhand(mainhand)

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

            createParty().then(data => {
                setPartyId(data.party.id)
                _partyId = data.party.id

                return data.party.shortcode
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

            createParty().then(data => {
                setPartyId(data.party.id)
                _partyId = data.party.id 

                return data.party.shortcode
            })
            .then(() => {
                saveWeapon(_partyId, weapon, position)
            })
        } else {
            saveWeapon(partyId, weapon, position)
        }
    }

    function createParty() {
        const options = {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST'
        }

        return fetch(`${endpoint}/api/v1/party`, options)
            .then(response => response.json())
    }

    function saveWeapon(pid: string, weapon: Weapon, position: number) {
        const body = JSON.stringify({
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': false
            }
        })

        const options = {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: body
        }

        fetch(`${endpoint}/api/v1/weapons`, options)
            .then(data => {
                console.log(data)
            })
    }

    function saveMainhand(pid: string, weapon: Weapon) {
        const body = JSON.stringify({
            'weapon': {
                'party_id': pid,
                'weapon_id': weapon.id,
                'mainhand': true
            }
        })

        const options = {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: body
        }

        fetch(`${endpoint}/api/v1/weapons`, options)
            .then(data => {
                console.log(data)
            })
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