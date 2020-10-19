import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import api from '~utils/api'

import PartySegmentedControl from '~components/PartySegmentedControl'
import WeaponGrid from '~components/WeaponGrid'
import SummonGrid from '~components/SummonGrid'
import CharacterGrid from '~components/CharacterGrid'
import Button from '~components/Button'

interface Props {
    hash: string
}

interface PartyProps extends RouteComponentProps<Props> {}

const Party: React.FC<PartyProps> = ({ match }) => {
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [editable, setEditable] = useState(false)

    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
    const [summons, setSummons] = useState<GridArray<Summon>>({})

    const [mainWeapon, setMainWeapon] = useState<Weapon>()
    const [mainSummon, setMainSummon] = useState<Summon>()
    const [friendSummon, setFriendSummon] = useState<Summon>()

    const [partyId, setPartyId] = useState('')
    const [cookies, setCookie] = useCookies(['userId'])
    const [selectedTab, setSelectedTab] = useState('weapons')
    const [tab, setTab] = useState<JSX.Element>()
    const shortcode = match.params.hash || ''

    useEffect(() => {
        fetchGrid(shortcode)
    }, [])

    async function fetchGrid(shortcode: string) {
        return api.endpoints.parties.getOne({ id: shortcode })
            .then(response => {
                const party = response.data.party

                const partyUser = party.user_id
                const loggedInUser = (cookies.user) ? cookies.user.user_id : ''

                if (partyUser != undefined && loggedInUser != undefined && partyUser === loggedInUser)
                    setEditable(true)

                let weapons: GridArray<Weapon> = {}
                let summons: GridArray<Summon> = {}
                party.weapons.forEach((gridWeapon: GridWeapon) => {
                    if (gridWeapon.mainhand)
                        setMainWeapon(gridWeapon.weapon)
                    else if (!gridWeapon.mainhand && gridWeapon.position != null)
                        weapons[gridWeapon.position] = gridWeapon.weapon
                })

                party.summons.forEach((gridSummon: GridSummon) => {
                    if (gridSummon.main)
                        setMainSummon(gridSummon.summon)
                    else if (gridSummon.friend)
                        setFriendSummon(gridSummon.summon)
                    else if (!gridSummon.main && !gridSummon.friend && gridSummon.position != null)
                        summons[gridSummon.position] = gridSummon.summon
                })

                setFound(true)
                setLoading(false)
                setWeapons(weapons)
                setSummons(summons)
                setPartyId(party.id)
            })
            .catch(error => {
                if (error.response != null) {
                    if (error.response.status == 404) {
                        setFound(false)
                        setLoading(false)
                    }
                } else {
                    console.error(error)
                }
            })
    }

    function segmentClicked(event: React.ChangeEvent<HTMLInputElement>) {
        setSelectedTab(event.target.value)

        switch(event.target.value) {
            case 'weapons':
                setTab((
                    <WeaponGrid
                        userId={cookies.user ? cookies.user.user_id : ''}
                        partyId={partyId}
                        mainhand={mainWeapon}
                        grid={weapons}
                        editable={editable}
                        exists={true}
                        found={found}
                    />
                ))
                break
            case 'summons':
                setTab((
                    <SummonGrid 
                        userId={cookies.user ? cookies.user.user_id : ''}
                        partyId={partyId}
                        main={mainSummon}
                        friend={friendSummon}
                        grid={summons}
                        editable={editable}
                        exists={true}
                        found={found}
                    />
                ))
                break
            case 'characters':
                setTab((
                    <CharacterGrid
                        editable={true}
                    />
                ))
                break
            default: 
                break
        }
    }

    function render() {
        return (
            <div id="Content">
                <PartySegmentedControl
                    selectedTab={selectedTab}
                    onClick={segmentClicked}
                />

                {tab || (
                    <WeaponGrid 
                        userId={cookies.user ? cookies.user.user_id : ''}
                        partyId={partyId}
                        mainhand={mainWeapon}
                        grid={weapons}
                        editable={editable}
                        exists={true}
                        found={found} 
                    />
                )}
            </div>
        )
    }

    function renderNotFound() {
        return (
            <div id="NotFound">
                <h2>There's no grid here.</h2>
                <Button type="new">New grid</Button>
            </div>
        )
    }

    if (!found && !loading) {
        return renderNotFound()
    } else if (found && !loading) {
        return render()
    } else {
        return (<div />)
    }
}

export default 
    withCookies(
        withRouter(
            Party
        )
    )