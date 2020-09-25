import React from 'react'
import { createPortal } from 'react-dom'
import api from '~utils/api'

import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'
import WeaponResult from '~components/WeaponResult/WeaponResult'

import './SearchModal.css'

interface Props {
    close: () => void
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
    searchInput: React.RefObject<HTMLInputElement>

    constructor(props: Props) {
        super(props)
        this.state = {
            query: '',
            results: {},
            loading: false,
            message: '',
            totalResults: 0
        }
        this.searchInput = React.createRef<HTMLInputElement>()
    }

    componentDidMount() {
        if (this.searchInput.current) {
            this.searchInput.current.focus()
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

    inputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        return (
            <ul id="results_container">
                { results.map( (result: Weapon) => {
                    return <WeaponResult key={result.id} data={result} onClick={() => { this.sendData(result) }} />
                })}
            </ul>
        )
    }

    renderEmptyState = () => {
        let string = ''

        if (this.state.query === '') {
            string = 'No weapons'
        } else {
            string = `No results found for '${this.state.query}'`
        }

        return (
            <div id="NoResults">
                <h2>{string}</h2>
            </div>
        )
    }

    render() {
        const { query, loading } = this.state

        let content: JSX.Element
        if (Object.entries(this.state.results).length == 0) {
            content = this.renderEmptyState()
        } else {
            content = this.renderSearchResults()
        }

        return (
            createPortal(
                <div>
                    <Modal styleName="SearchModal" key="search_modal">
                        <div id="input_container">
                            <label className="search_label" htmlFor="search_input">
                                <input 
                                    autoComplete="off"
                                    type="text"
                                    name="query" 
                                    className="Input" 
                                    id="search_input"
                                    ref={this.searchInput}
                                    value={query}
                                    placeholder={this.props.placeholderText}
                                    onChange={this.inputChanged}
                                />
                            </label>
                        </div>

                        {content}
                    </Modal>
                    <Overlay onClick={this.props.close} />
                </div>,
                document.body
            )
        )
    }
}

export default SearchModal