import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { useCookies } from 'react-cookie'

import PartySegmentedControl from '~components/PartySegmentedControl'
import PartyDetails from '~components/PartyDetails'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'

import api from '~utils/api'
import { appState } from '~utils/appState'
import { GridType, TeamElement } from '~utils/enums'

import './index.scss'
import { AxiosResponse } from 'axios'

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
    const { party } = useSnapshot(appState)
    const [currentTab, setCurrentTab] = useState<GridType>(GridType.Weapon)

    // Fetch data from the server
    useEffect(() => {
        const shortcode = (props.slug) ? props.slug : undefined

        if (shortcode)
            fetchDetails(shortcode)
        else
            appState.party.editable = true
    }, [props.slug])

    // Methods: Creating a new party
    async function createParty(extra: boolean = false) {
        let body = {
            party: {
                ...(cookies.user) && { user_id: cookies.user.user_id },
                extra: extra
            }
        }

        return await api.endpoints.parties.create(body, headers)
    }

    // Methods: Updating the party's details
    function checkboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
        appState.party.extra = event.target.checked

        if (party.id) {
            api.endpoints.parties.update(party.id, {
                'party': { 'extra': event.target.checked }
            }, headers)
        }
    }

    function updateDetails(name?: string, description?: string, raid?: Raid) {
        if (appState.party.name !== name ||
            appState.party.description !== description ||
            appState.party.raid?.id !== raid?.id) {
                if (appState.party.id)
                    api.endpoints.parties.update(appState.party.id, {
                        'party': {
                            'name': name,
                            'description': description,
                            'raid_id': raid?.id
                        }
                    }, headers)
                    .then(() => {
                        appState.party.name = name
                        appState.party.description = description
                        appState.party.raid = raid
                    })
            }

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

    // Methods: Fetch party details
    function fetchDetails(shortcode: string) {
        return api.endpoints.parties.getOne({ id: shortcode })
            .then(response => processResult(response))
            .catch(error => processError(error))
    }

    function processResult(response: AxiosResponse) {
        appState.party.id = response.data.party.id

        // Store the party's user-generated details
        appState.party.name = response.data.party.name
        appState.party.description = response.data.party.description
        appState.party.raid = response.data.party.raid
    }

    function processError(error: any) {
        if (error.response != null) {
            if (error.response.status == 404) {
                // setFound(false)
                // setLoading(false)
            }
        } else {
            console.error(error)
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
            { navigation }
            <section id="Party">
                { currentGrid() }
            </section>
            { <PartyDetails
                editable={party.editable}
                updateCallback={updateDetails}
            />}
        </div>
    )
}

export default Party