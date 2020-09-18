import React from 'react'
import Portal from '~utils/Portal'
import api from '~utils/api'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'
import WeaponResult from '~components/WeaponResult/WeaponResult'

import './SearchModal.css'

interface Props {
    close: OnClickEvent
    send: (weapon: Weapon, position: number) => any
    placeholderText: string
    fromPosition: number
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

    constructor(props: Props) {
        super(props)
        this.state = {
            query: '',
            results: {},
            loading: false,
            message: '',
            totalResults: 0
        }
    }

    fetchResults = (query: string) => {
        api.search(query)
            .then((response) => {
                const data = response.data
                const totalResults = data.length
                this.setState({
                    results: data,
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

    sendData = (result: Weapon) => {
        this.props.send(result, this.props.fromPosition)
        this.props.close()
    }

    renderSearchResults = () => {
        const { results } = this.state

        if (results.length) {
            return (
                <ul id="results_container">
                    { results.map( (result: Weapon) => {
                        return <WeaponResult key={result.id} data={result} onClick={() => { this.sendData(result) }} />
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