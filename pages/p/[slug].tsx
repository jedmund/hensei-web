import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import api from '~utils/api'

import Party from '~components/Party'
import Button from '~components/Button'

interface Props {
    hash: string
}

const PartyRoute: React.FC = () => {
    const router = useRouter()
    const { slug } = router.query

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
    const [extra, setExtra] = useState<boolean>(false)
    const [cookies, _] = useCookies(['user'])

    useEffect(() => {
        async function fetchGrid(shortcode: string) {
            return api.endpoints.parties.getOne({ id: shortcode })
                .then(response => {
                    const party = response.data.party
                
                    const partyUser = (party.user_id) ? party.user_id : undefined
                    const loggedInUser = (cookies.user) ? cookies.user.user_id : ''
    
                    if (partyUser != undefined && loggedInUser != undefined && partyUser === loggedInUser)
                        setEditable(true)
    
                    const characters = populateCharacters(party.characters)
                    const weapons = populateWeapons(party.weapons)
                    const summons = populateSummons(party.summons)
                    
                    setExtra(response.data.party.is_extra)
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

        function populateCharacters(list: [GridCharacter]) {
            let characters: GridArray<Character> = {}

            list.forEach((object: GridCharacter) => {
                if (object.position != null)
                    characters[object.position] = object.character
            })

            return characters
        }

        function populateWeapons(list: [GridWeapon]) {
            let weapons: GridArray<Weapon> = {}

            list.forEach((object: GridWeapon) => {
                if (object.mainhand)
                    setMainWeapon(object.weapon)
                else if (!object.mainhand && object.position != null)
                    weapons[object.position] = object.weapon
            })

            return weapons
        }

        function populateSummons(list: [GridSummon]) {
            let summons: GridArray<Summon> = {}

            list.forEach((object: GridSummon) => {
                if (object.main)
                    setMainSummon(object.summon)
                else if (object.friend)
                    setFriendSummon(object.summon)
                else if (!object.main && !object.friend && object.position != null)
                    summons[object.position] = object.summon
            })

            return summons
        }

        const shortcode: string = slug as string 
        fetchGrid(shortcode)
    }, [slug, cookies.user])

    function render() {
        return (
            <div id="Content">
                <Party
                    partyId={partyId}
                    mainWeapon={mainWeapon}
                    mainSummon={mainSummon}
                    friendSummon={friendSummon}
                    characters={characters}
                    weapons={weapons}
                    summons={summons}
                    editable={editable}
                    exists={found}
                    extra={extra}
                />
            </div>
        )
    }

    function renderNotFound() {
        return (
            <div id="NotFound">
                <h2>There&apos;s no grid here.</h2>
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
        PartyRoute
    )