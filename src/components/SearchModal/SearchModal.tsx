import React from 'react'
import Portal from '../../Portal'

import Modal from '../Modal/Modal'
import Overlay from '../Overlay/Overlay'
import WeaponResult from '../WeaponResult/WeaponResult'

import './SearchModal.css'

interface Props {
    close: () => void
    send: (weapon: Weapon) => void
    placeholderText: string
}

interface State {
    query: string,
    results: { [key: string]: any }
    loading: boolean
    message: string
    totalResults: number
}

class SearchModal extends React.Component<Props, State> {
    searchQuery

    constructor(props) {
        super(props)
        this.state = {
            query: '',
            results: {},
            loading: false,
            message: '',
            totalResults: 0
        }
    }

    fetchResults = (query) => {
        fetch(`http://grid-api.ngrok.io/api/v1/search?query=${query}`)
            .then(res => res.json())
            .then((result) => {
                const totalResults = result.length
                this.setState({
                    results: result,
                    totalResults: totalResults,
                    loading: false
                })
            }, (error) => {
                this.setState({
                    loading: false,
                    message: error
                })
            })
    }

    inputChanged = (event) => {
        const query = event.target.value
        if (query.length) {
            this.setState({ query, loading: true, message: '' }, () => {
                this.fetchResults(query)
            })
        } else {
            this.setState({ query, results: {}, message: '' })
        }
    }

    renderSearchResults = () => {
        const { results } = this.state

        if (results.length) {
            return (
                <ul id="results_container">
                    { results.map( result => {
                        return <WeaponResult key={result.id} data={result} onClick={() => { this.props.send(result) }} />
                    })}
                </ul>
            )
        }
    }

    render() {
        const { query, loading } = this.state

        return (
            <Portal key="search_portal">
                <Modal styleName="SearchModal" key="search_modal">
                    <div id="input_container">
                        <label className="search_label" htmlFor="search_input">
                            <input 
                                autoComplete="off"
                                type="text"
                                name="query" 
                                className="Input" 
                                id="search_input"
                                value={query}
                                placeholder={this.props.placeholderText}
                                onChange={this.inputChanged}
                            />
                        </label>
                    </div>

                    { this.renderSearchResults() }
                    
                </Modal>
                <Overlay onClick={this.props.close} />
            </Portal>
        )
    }
}

export default SearchModal