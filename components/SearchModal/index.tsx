import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'

import state from '~utils/state'
import api from '~utils/api'

import * as Dialog from '@radix-ui/react-dialog'

import CharacterResult from '~components/CharacterResult'
import WeaponResult from '~components/WeaponResult'
import SummonResult from '~components/SummonResult'

import './index.scss'
import PlusIcon from '~public/icons/Add.svg'

interface Props {
    send: (object: Character | Weapon | Summon, position: number) => any
    placeholderText: string
    fromPosition: number
    object: 'weapons' | 'characters' | 'summons',
    children: React.ReactNode
}

const SearchModal = (props: Props) => {
    let { grid } = useSnapshot(state)

    let searchInput = React.createRef<HTMLInputElement>()

    const [pool, setPool] = useState(Array<Character | Weapon | Summon>())
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [totalResults, setTotalResults] = useState(0)

    useEffect(() => {
        if (props.object === 'characters') {
            setPool(Object.values(grid.characters).map(o => o.character))
        } else if (props.object === 'weapons') {
            setPool(Object.values(grid.weapons.allWeapons).map(o => o.weapon))
        } else if (props.object === 'summons') {
            setPool(Object.values(grid.summons.allSummons).map(o => o.summon))
        }
    }, [grid, props.object])

    useEffect(() => {
        if (searchInput.current)
            searchInput.current.focus()
    }, [searchInput])

    function filterExclusions(object: Character | Weapon | Summon) {
        if (pool[props.fromPosition] &&
            object.granblue_id === pool[props.fromPosition].granblue_id)
                return null
        else return object
    }

    function inputChanged(event: React.ChangeEvent<HTMLInputElement>) {
        const text = event.target.value
        if (text.length) {
            setQuery(text)
            setLoading(true)
            setMessage('')

            if (text.length > 2)
                fetchResults()
        } else {
            setQuery('')
            setResults({})
            setMessage('')
        }
    }
    
    function fetchResults() {
        const excludes = Object.values(pool)
            .filter(filterExclusions)
            .map((o) => { return o.name.en }).join(',')

        api.search(props.object, query, excludes)
            .then(response => {
                setResults(response.data)
                setTotalResults(response.data.length)
                setLoading(false)
            })
            .catch(error => {
                setMessage(error)
                setLoading(false)
            }) 
    }

    function sendData(result: Character | Weapon | Summon) {
        props.send(result, props.fromPosition)
        setOpen(false)
    }

    function renderResults() {
        switch(props.object) {
            case 'weapons':
                return renderWeaponSearchResults(results)
                break
            case 'summons':
                return renderSummonSearchResults(results)
                break
            case 'characters':
                return renderCharacterSearchResults(results) 
                break
        }
    }

    function renderWeaponSearchResults(results: { [key: string]: any }) {
        const elements = results.map((result: Weapon) => {
            return <WeaponResult 
                key={result.id} 
                data={result} 
                onClick={() => { sendData(result) }} 
            />
        })

        return (<ul id="results_container">{elements}</ul>)
    }

    function renderSummonSearchResults(results: { [key: string]: any }) {
        const elements = results.map((result: Summon) => {
            return <SummonResult 
                key={result.id} 
                data={result} 
                onClick={() => { sendData(result) }} 
            />
        })

        return (<ul id="results_container">{elements}</ul>)
    }

    function renderCharacterSearchResults(results: { [key: string]: any }) {
        const elements = results.map((result: Character) => {
            return <CharacterResult 
                key={result.id} 
                data={result} 
                onClick={() => { sendData(result) }} 
            />
        })

        return (<ul id="results_container">{elements}</ul>)
    }

    function renderEmptyState() {
        let string = ''

        if (query === '') {
            string = `No ${props.object}`
        } else if (query.length < 3) {
            string = `Type at least 3 characters`
        } else {
            string = `No results found for '${query}'`
        }

        return (
            <div id="NoResults">
                <h2>{string}</h2>
            </div>
        )
    }
    
    function resetAndClose() {
        setQuery('')
        setResults({})
        setOpen(true)
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                {props.children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <div className="ModalContainer">
                    <Dialog.Content className="Search Modal">
                        <div id="ModalHeader">
                            <label className="search_label" htmlFor="search_input">
                                <input 
                                    autoComplete="off"
                                    type="text"
                                    name="query" 
                                    className="Input" 
                                    id="search_input"
                                    ref={searchInput}
                                    value={query}
                                    placeholder={props.placeholderText}
                                    onChange={inputChanged}
                                />
                            </label> 
                            <Dialog.Close onClick={resetAndClose}>
                                <PlusIcon />
                            </Dialog.Close>
                        </div>
                        { ((Object.entries(results).length == 0) ? renderEmptyState() : renderResults()) }
                    </Dialog.Content>
                </div>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default SearchModal