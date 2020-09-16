import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router'

import WeaponGridMainhand from '../WeaponGridMainhand/WeaponGridMainhand'
import WeaponGridUnit from '../WeaponGridUnit/WeaponGridUnit'

import './WeaponGrid.css'

const WeaponGrid = (props: null) => {
    const [partyId, setPartyId] = useState<string>()
    const [shortcode, setShortcode] = useState<string>()

    const [mainhand, setMainhand] = useState<Weapon>()
    const [weapons, setWeapons] = useState<{ [key: number]: Weapon }>({})

    const numWeapons: number = 9

    useEffect(() => {
        const shortcode = props.match.params.hash

        if (shortcode) {
            console.log(shortcode)
        } else {
            console.log('nothing')
        }
    }, [])

    function fetchGrid(shortcode: string) {
        // const body = JSON.stringify({
        //     'weapon': {
        //         'party_id': pid,
        //         'weapon_id': weapon.id,
        //         'position': position
        //     }
        // })

        // const options = {
        //     headers: { 'Content-Type': 'application/json' },
        //     method: 'POST',
        //     body: body
        // }
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

        return fetch('http://127.0.0.1:3000/api/v1/party', options)
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

        fetch('http://127.0.0.1:3000/api/v1/weapons', options)
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

        fetch('http://127.0.0.1:3000/api/v1/weapons', options)
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