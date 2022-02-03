import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'

import PartySegmentedControl from '~components/PartySegmentedControl'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

import api from '~utils/api'
import './index.scss'

// GridType
enum GridType {
    Class,
    Character,
    Weapon,
    Summon
}

// Props
interface Props {
    partyId?: string
    mainWeapon?: GridWeapon
    mainSummon?: GridSummon
    friendSummon?: GridSummon
    characters?: GridArray<GridCharacter>
    weapons?: GridArray<GridWeapon>
    summons?: GridArray<GridSummon>
    extra: boolean
    editable: boolean
    pushHistory?: (path: string) => void
}

const Party = (props: Props) => {
    // Cookies
    const [cookies, _] = useCookies(['user'])
    const headers = (cookies.user != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.user.access_token}`
        }
    } : {}

    // Set up states
    const [extra, setExtra] = useState<boolean>(false)
    const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)

    // Set states from props
    useEffect(() => {
        setExtra(props.extra || false)
    }, [props])

    // Methods: Creating a new party
    async function createParty() {
        let body = {
            party: {
                ...(cookies.user) && { user_id: cookies.user.user_id },
                is_extra: extra
            }
        }

        return await api.endpoints.parties.create(body, headers)
    }

    // Methods: Updating the party's extra flag
    // Note: This doesn't save to the server yet.
    function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
        setExtra(event.target.checked)
    }

    // Methods: Navigating with segmented control
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

    // Render: JSX components
    const navigation = (
        <PartySegmentedControl
            extra={extra}
            editable={props.editable}
            selectedTab={currentTab}
            onClick={segmentClicked}
            onCheckboxChange={checkboxChanged}
        />
    )

    const weaponGrid = (
        <WeaponGrid 
            partyId={props.partyId}
            mainhand={props.mainWeapon}
            weapons={props.weapons || {}}
            extra={extra}
            editable={props.editable}
            createParty={createParty}
            pushHistory={props.pushHistory}
        />
    )

    const summonGrid = (
        <SummonGrid 
            partyId={props.partyId}
            mainSummon={props.mainSummon}
            friendSummon={props.friendSummon}
            summons={props.summons || {}}
            editable={props.editable} 
            createParty={createParty}
            pushHistory={props.pushHistory}
        />
    )

    const characterGrid = (
        <CharacterGrid
            partyId={props.partyId}
            characters={props.characters || {}}
            editable={props.editable}
            createParty={createParty}
            pushHistory={props.pushHistory}
        />
    )

    const currentGrid = () => {
        switch(currentTab) {
            case GridType.Character:
                return characterGrid
            case GridType.Weapon:
                return weaponGrid
            case GridType.Summon:
                return summonGrid
        }
    }

    return (
        <div>
            { navigation }
            { currentGrid() }
        </div>
    )
}

export default Party