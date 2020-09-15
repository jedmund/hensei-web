import React from 'react'
import { v1 as uuidv1 } from 'uuid'

import Portal from '../../Portal'

import Modal from '../Modal/Modal'
import Overlay from '../Overlay/Overlay'

import './SearchModal.css'

interface Props {
    close: () => void
    placeholderText: string
}

interface State {
    query: string,
    results: { [key: string]: any }
    isLoaded: boolean
    message: string
}

class SearchModal extends React.Component<Props, State> {
    searchQuery

    constructor(props) {
        super(props)
        this.state = {
            query: '',
            results: {},
            isLoaded: false,
            message: ''
		}
    }

    fetchResults = (query) => {
        fetch(`http://127.0.0.1:3000/api/v1/search?query=${query}`)
            .then(res => res.json())
            .then((result) => {
                // console.log("hello world!")
                console.log(result)
                // this.setState({
                //     isLoaded: true,
                //     results: result
                // })
            }, (error) => {
                // this.setState({
                //     isLoaded: true,
                //     message: error
                // })
            })
    }

    inputChanged = (event) => {
        const query = this.searchQuery.value
        if (query.length > 2) {
            console.log(query)
            this.fetchResults(query)
        }
        
        // if (query) {
        //     this.setState({ query, isLoaded: true, message: '' }, () => {
        //         // this.fetchResults(query)
        //     })
        // } else {
        //     this.setState({ query, results: {}, message: '' })
        // }
    }

    render() {
        const { query, isLoaded, message } = this.state

        return (
            <Portal key="search_portal">
                <Modal styleName="SearchModal" key="search_modal">
                    <input 
                        className="Input" 
                        defaultValue={query}
                        id="SearchInput" 
                        name="query" 
                        key="search_input_key"
                        type="text"
                        ref={el => this.searchQuery = el}
                        onChange={this.inputChanged}
                        placeholder={this.props.placeholderText}
                    />
                </Modal>
                <Overlay onClick={this.props.close} />
            </Portal>
        )
    }
}

export default SearchModal