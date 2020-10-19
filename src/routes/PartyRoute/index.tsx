import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import api from '~utils/api'

import Party from '~components/Party'
import Button from '~components/Button'

interface Props {
    hash: string
}

interface PartyProps extends RouteComponentProps<Props> {}

const PartyRoute: React.FC<PartyProps> = ({ match }) => {
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [editable, setEditable] = useState(false)

    const [characters, setCharacters] = useState<GridArray<Character>>({})
    const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
    const [summons, setSummons] = useState<GridArray<Summon>>({})

    const [mainWeapon, setMainWeapon] = useState<Weapon>()
    const [mainSummon, setMainSummon] = useState<Summon>()
    const [friendSummon, setFriendSummon] = useState<Summon>()

    const [partyId, setPartyId] = useState('')
    const [cookies, setCookie] = useCookies(['user'])
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

                let characters: GridArray<Character> = {}
                let weapons: GridArray<Weapon> = {}
                let summons: GridArray<Summon> = {}

                party.characters.forEach((gridCharacter: GridCharacter) => {
                    if (gridCharacter.position != null)
                        characters[gridCharacter.position] = gridCharacter.character
                })

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
                setCharacters(characters)
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

    function render() {
        return (
            <div id="Content">
                <Party
                    mainWeapon={mainWeapon}
                    mainSummon={mainSummon}
                    friendSummon={friendSummon}
                    characters={characters}
                    weapons={weapons}
                    summons={summons}
                    editable={editable}
                    exists={found}
                />
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
            PartyRoute
        )
    )