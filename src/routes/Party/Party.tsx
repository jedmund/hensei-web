import React from 'react'
import {withRouter} from 'react-router'

class Party extends React.Component {
    render() {
        var hash = this.props.match.params.hash
        return (
            <div>
                <h1>A specific party with hash: {hash}</h1>
            </div>
        )
    }
}

export default withRouter(Party)