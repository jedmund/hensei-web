import React, { useEffect, useState } from 'react'
import { withCookies, useCookies } from 'react-cookie'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import api from '~utils/api'

import WeaponGrid from '~components/WeaponGrid'
import Button from '~components/Button'

interface Props {
    hash: string
}

interface State {
    found: boolean
    editable: boolean
    mainhand: Weapon,
    grid: GridArray,
    partyId: string
}

interface PartyProps extends RouteComponentProps<Props> {}

type GridArray = { [key: number]: Weapon } 
interface GridWeapon {
    id: string
    mainhand: boolean
    position: number | null
    weapon: Weapon
}

const Party: React.FC<PartyProps> = ({ match }, state: State) => {
    const [found, setFound] = useState(false)
    const [loading, setLoading] = useState(true)
    const [editable, setEditable] = useState(false)
    const [grid, setGrid] = useState<GridArray>({})
    const [mainhand, setMainhand] = useState<Weapon>()
    const [partyId, setPartyId] = useState('')
    const [cookies, setCookie] = useCookies(['userId'])

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

                let weapons: GridArray = {}
                party.grid.forEach((gridWeapon: GridWeapon) => {
                    if (gridWeapon.mainhand)
                        setMainhand(gridWeapon.weapon)
                    else if (!gridWeapon.mainhand && gridWeapon.position != null)
                        weapons[gridWeapon.position] = gridWeapon.weapon
                })

                setFound(true)
                setLoading(false)
                setGrid(weapons)
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
            <div>
                <WeaponGrid
                    userId={cookies.user ? cookies.user.user_id : ''}
                    partyId={partyId}
                    mainhand={mainhand}
                    grid={grid}
                    editable={editable}
                    exists={true}
                    found={found}
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
            Party
        )
    )