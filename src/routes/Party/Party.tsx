import React from 'react'
import { withRouter } from 'react-router'

import WeaponGrid from '../../components/WeaponGrid/WeaponGrid'

class Party extends React.Component {
    render() {
        var hash = this.props.match.params.hash
        return (
            <div>
                <WeaponGrid />
            </div>
        )
    }
}

export default withRouter(Party)