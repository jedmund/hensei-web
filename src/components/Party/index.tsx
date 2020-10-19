import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

// UI Elements
import PartySegmentedControl from '~components/PartySegmentedControl'

// Grids
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

// GridType
export enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

import './index.css'

interface Props {
    mainWeapon?: Weapon
    mainSummon?: Summon
    friendSummon?: Summon
    weapons?: GridArray<Weapon>
    summons?: GridArray<Summon>
    editable: boolean
    exists: boolean
    pushHistory?: (path: string) => void
}

const Party = (props: Props) => {
    const [cookies, setCookie] = useCookies(['user'])

    const headers = (cookies.user) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    // Grid data
    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
    const [summons, setSummons] = useState<GridArray<Summon>>({})

    const [mainWeapon, setMainWeapon] = useState<Weapon>()
    const [mainSummon, setMainSummon] = useState<Summon>()
    const [friendSummon, setFriendSummon] = useState<Summon>()

    useEffect(() => {
        setMainWeapon(props.mainWeapon)
        setMainSummon(props.mainSummon)
        setFriendSummon(props.friendSummon)
        setWeapons(props.weapons || {})
        setSummons(props.summons || {})
    }, [props.mainWeapon, props.mainSummon, props.friendSummon, props.weapons, props.summons])

    const weaponGrid = (
        <WeaponGrid 
            userId={cookies.user ? cookies.user.userId : ''} 
            mainhand={mainWeapon}
            grid={weapons}
            editable={props.editable} 
            exists={props.exists}
            onSelect={itemSelected}
        />
    )

    const summonGrid = (
        <SummonGrid 
            userId={cookies.user ? cookies.user.userId : ''} 
            main={mainSummon}
            friend={friendSummon}
            grid={summons}
            editable={props.editable} 
            exists={props.exists} 
            onSelect={itemSelected}
        />
    )

    const characterGrid = (
        <CharacterGrid
            editable={props.editable}
            exists={props.exists}
            onSelect={itemSelected}
        />
    )

    const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)
    const [partyId, setPartyId] = useState('')

    function segmentClicked(event: React.ChangeEvent<HTMLInputElement>) {
        switch(event.target.value) {
            case 'characters':
                setCurrentTab(GridType.Character)
                break
            case 'weapons':
                setCurrentTab(GridType.Weapon)
                break
            case 'summons':
                setCurrentTab(GridType.Summon)
                break
            default: 
                break
        }
    }

    function itemSelected(type: GridType, item: Character | Weapon | Summon, position: number) {
        if (!partyId) {
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
                    setPartyId(partyId)
                    saveItem(partyId, type, item, position)
                })
        } else {
            saveItem(partyId, type, item, position)
        }
    }

    async function createParty() {
        const body = (cookies.userId === undefined) ? {} : {
            party: {
                user_id: cookies.userId
            }
        }

        return await api.endpoints.parties.create(body, headers)
    }

    function saveItem(partyId: string, type: GridType, item: Character | Weapon | Summon, position: number) {
        switch(type) {
            case GridType.Class:
                saveClass()
                break
            case GridType.Character:
                saveCharacter(item as Character, position, partyId)
                break
            case GridType.Weapon:
                const weapon = item as Weapon
                saveWeapon(weapon, position, partyId)
                    .then(() => {
                        storeWeapon(weapon, position)
                    })
                break
            case GridType.Summon:
                const summon = item as Summon
                saveSummon(summon, position, partyId)
                    .then(() => {
                        storeSummon(summon, position)
                    })
                break
        }
    }
    
    // Weapons
    function storeWeapon(weapon: Weapon, position: number) {
        if (position == -1) {
            setMainWeapon(weapon)
        } else {
            // Store the grid unit weapon at the correct position
            let newWeapons = Object.assign({}, weapons)
            newWeapons[position] = weapon
            setWeapons(newWeapons)
        }
    }

    async function saveWeapon(weapon: Weapon, position: number, party: string) {
        await api.endpoints.weapons.create({
            'weapon': {
                'party_id': party,
                'weapon_id': weapon.id,
                'position': position,
                'mainhand': (position == -1)
            }
        }, headers)
    }

    // Summons
    function storeSummon(summon: Summon, position: number) {
        if (position == -1) {
            setMainSummon(summon)
        } else if (position == 4) {
            setFriendSummon(summon)
        } else {
            // Store the grid unit summon at the correct position
            let newSummons = Object.assign({}, summons)
            newSummons[position] = summon
            setSummons(newSummons)
        }
    }

    async function saveSummon(summon: Summon, position: number, party: string) {
        await api.endpoints.summons.create({
            'summon': {
                'party_id': party,
                'summon_id': summon.id,
                'position': position,
                'main': (position == -1),
                'friend': (position == 4)
            }
        }, headers)
    }

    // Character
    function saveCharacter(character: Character, position: number, party: string) {
        // TODO: Implement this
    }

    // Class
    function saveClass() {
        // TODO: Implement this
    }

    return (
        <div>
            <PartySegmentedControl
                selectedTab={currentTab}
                onClick={segmentClicked}
            />
            
            {
                (() => {
                    switch(currentTab) {
                        case GridType.Character:
                            return characterGrid
                        case GridType.Weapon:
                            return weaponGrid
                        case GridType.Summon:
                            return summonGrid
                    }
                })()
            }
        </div>
    )
}

export default Party