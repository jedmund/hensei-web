import React, { useContext, useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { useRouter } from 'next/router'

import AppContext from '~context/AppContext'
import api from '~utils/api'

import Party from '~components/Party'
import Button from '~components/Button'

interface Props {
    hash: string
}

const PartyRoute: React.FC = () => {
    const router = useRouter()
    const { party: slug } = router.query

    const { setEditable: setEditableContext } = useContext(AppContext)

    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [editable, setEditable] = useState(false)

    const [characters, setCharacters] = useState<GridArray<GridCharacter>>({})
    const [weapons, setWeapons] = useState<GridArray<GridWeapon>>({})
    const [summons, setSummons] = useState<GridArray<GridSummon>>({})

    const [mainWeapon, setMainWeapon] = useState<GridWeapon>()
    const [mainSummon, setMainSummon] = useState<GridSummon>()
    const [friendSummon, setFriendSummon] = useState<GridSummon>()

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
    
                    if (partyUser != undefined && loggedInUser != undefined && partyUser === loggedInUser) {
                        setEditable(true)
                        setEditableContext(true)
                    }
    
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
            let characters: GridArray<GridCharacter> = {}

            list.forEach((object: GridCharacter) => {
                if (object.position != null)
                    characters[object.position] = object
            })

            return characters
        }

        function populateWeapons(list: [GridWeapon]) {
            let weapons: GridArray<GridWeapon> = {}

            list.forEach((object: GridWeapon) => {
                if (object.mainhand)
                    setMainWeapon(object)
                else if (!object.mainhand && object.position != null)
                    weapons[object.position] = object
            })

            return weapons
        }

        function populateSummons(list: [GridSummon]) {
            let summons: GridArray<GridSummon> = {}

            list.forEach((object: GridSummon) => {
                if (object.main)
                    setMainSummon(object)
                else if (object.friend)
                    setFriendSummon(object)
                else if (!object.main && !object.friend && object.position != null)
                    summons[object.position] = object
            })

            return summons
        }

        const shortcode: string = slug as string 
        fetchGrid(shortcode)
    }, [slug, cookies.user, setEditableContext])

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