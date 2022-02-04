import React, { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'

import PartyContext from '~context/PartyContext'

import PartySegmentedControl from '~components/PartySegmentedControl'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

import api from '~utils/api'
import { TeamElement } from '~utils/enums'

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
    slug?: string
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
    const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)
    const [id, setId] = useState('')
    const [element, setElement] = useState<TeamElement>(TeamElement.Any)
    const [editable, setEditable] = useState(false)
    const [hasExtra, setHasExtra] = useState(false)

    // Methods: Creating a new party
    async function createParty(extra: boolean = false) {
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
        setHasExtra(event.target.checked)
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
            selectedTab={currentTab}
            onClick={segmentClicked}
            onCheckboxChange={checkboxChanged}
        />
    )

    const weaponGrid = (
        <WeaponGrid 
            slug={props.slug}
            createParty={createParty}
            pushHistory={props.pushHistory}
        />
    )

    const summonGrid = (
        <SummonGrid 
            slug={props.slug}
            createParty={createParty}
            pushHistory={props.pushHistory}
        />
    )

    const characterGrid = (
        <CharacterGrid
            slug={props.slug}
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
            <PartyContext.Provider value={{ id, setId, element, setElement, editable, setEditable, hasExtra, setHasExtra }}>
                { navigation }
                { currentGrid() }
            </PartyContext.Provider>
        </div>
    )
}

export default Party