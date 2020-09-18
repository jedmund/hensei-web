import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router'

import WeaponGrid from '../../components/WeaponGrid/WeaponGrid'

interface RouterProps {
    hash: string
}

interface PartyProps extends RouteComponentProps<RouterProps> {

}

const Party: React.FC<PartyProps> = ({ match }) => {
    const shortcode = match.params.hash || ''

    return (
        <div>
            <WeaponGrid shortcode={shortcode} editable={false} />
        </div>
    )
}

export default withRouter(Party)