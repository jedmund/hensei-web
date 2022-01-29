import React, { ChangeEvent, useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import api from '~utils/api'

// UI Elements
import PartySegmentedControl from '~components/PartySegmentedControl'

// Grids
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

// GridType
enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}
export { GridType }

import './index.scss'

interface Props {
    partyId?: string
    mainWeapon?: Weapon
    mainSummon?: Summon
    friendSummon?: Summon
    characters?: GridArray<Character>
    weapons?: GridArray<Weapon>
    summons?: GridArray<Summon>
    extra: boolean
    editable: boolean
    exists: boolean
    pushHistory?: (path: string) => void
}

const Party = (props: Props) => {
    const [cookies, setCookie] = useCookies(['user'])

    const headers = (cookies.user != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    // Grid data
    const [characters, setCharacters] = useState<GridArray<Character>>({})
    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
    const [summons, setSummons] = useState<GridArray<Summon>>({})

    const [mainWeapon, setMainWeapon] = useState<Weapon>()
    const [mainSummon, setMainSummon] = useState<Summon>()
    const [friendSummon, setFriendSummon] = useState<Summon>()

    const [extra, setExtra] = useState<boolean>(false)

    useEffect(() => {
        setPartyId(props.partyId || '')
        setMainWeapon(props.mainWeapon)
        setMainSummon(props.mainSummon)
        setFriendSummon(props.friendSummon)
        setCharacters(props.characters || {})
        setWeapons(props.weapons || {})
        setSummons(props.summons || {})
        setExtra(props.extra || false)
    }, [props.partyId, props.mainWeapon, props.mainSummon, props.friendSummon, props.characters, props.weapons, props.summons, props.extra])

    const weaponGrid = (
        <WeaponGrid 
            userId={cookies.user ? cookies.user.userId : ''} 
            mainhand={mainWeapon}
            grid={weapons}
            editable={props.editable} 
            exists={props.exists}
            extra={extra}
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
            userId={cookies.user ? cookies.user.userId : ''}
            grid={characters}
            editable={props.editable}
            exists={props.exists}
            onSelect={itemSelected}
        />
    )

    const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)
    const [partyId, setPartyId] = useState('')

    function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
        setExtra(event.target.checked)
    }

    function segmentClicked(event: React.ChangeEvent<HTMLInputElement>) {
        switch(event.target.value) {
            case 'class':
                setCurrentTab(GridType.Class)
                break
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
        const body = (cookies.user.userId === undefined) ? {
            party: {
                is_extra: extra
            }
        } : {
            party: {
                user_id: cookies.user.userId,
                is_extra: extra
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
                const character = item as Character
                saveCharacter(character, position, partyId)
                    .then(() => {
                        storeCharacter(character, position)
                    })
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
        } else if (position == 6) {
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
                'friend': (position == 6)
            }
        }, headers)
    }

    // Character
    function storeCharacter(character: Character, position: number) {
        // Store the grid unit character at the correct position
        let newCharacters = Object.assign({}, characters)
        newCharacters[position] = character
        setCharacters(newCharacters)
    }

    async function saveCharacter(character: Character, position: number, party: string) {
        await api.endpoints.characters.create({
            'character': {
                'party_id': party,
                'character_id': character.id,
                'position': position
            }
        }, headers)
    }

    // Class
    function saveClass() {
        // TODO: Implement this
    }

    return (
        <div>
            <PartySegmentedControl
                extra={extra}
                editable={props.editable}
                selectedTab={currentTab}
                onClick={segmentClicked}
                onCheckboxChange={checkboxChanged}
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