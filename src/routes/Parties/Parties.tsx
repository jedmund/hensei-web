import React from 'react'

interface State {
    parties: {id: string, hash: string}[]
}

class Parties extends React.Component {
    state: State
    
    constructor(props) {
        super(props)
        this.state = {
            parties: []
        }
    }
    
    getParties() {
        fetch('http://localhost:3001/parties/')
            .then(response => response.json())
            .then(parties => this.setState({
                parties: parties
            }))
    }

    render() {
        this.getParties()
        const items = this.state.parties.map((party: {id: string, hash: string }) =>
            <li key={party.id}><a href={'../' + party.hash}>{party.hash}</a></li>
        )
        return (
            <div>
                <h1>A list of parties</h1>
                <ul>{items}</ul>
            </div>
        )
    }
}

export default Parties