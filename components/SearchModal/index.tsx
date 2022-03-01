import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'

import { appState } from '~utils/appState'
import api from '~utils/api'

import * as Dialog from '@radix-ui/react-dialog'

import CharacterResult from '~components/CharacterResult'
import WeaponResult from '~components/WeaponResult'
import SummonResult from '~components/SummonResult'

import './index.scss'
import CrossIcon from '~public/icons/Cross.svg'

interface Props {
    send: (object: Character | Weapon | Summon, position: number) => any
    placeholderText: string
    fromPosition: number
    object: 'weapons' | 'characters' | 'summons',
    children: React.ReactNode
}

const SearchModal = (props: Props) => {
    let { grid } = useSnapshot(appState)

    let searchInput = React.createRef<HTMLInputElement>()

    const [objects, setObjects] = useState<{[id: number]: GridCharacter | GridWeapon | GridSummon}>()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [totalResults, setTotalResults] = useState(0)

    useEffect(() => {   
        setObjects(grid[props.object])
    }, [grid, props.object])

    useEffect(() => {
        if (searchInput.current)
            searchInput.current.focus()
    }, [searchInput])

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
        // Exclude objects in grid from search results
        // unless the object is in the position that the user clicked
        // so that users can replace object versions with 
        // compatible other objects.
        const excludes = (objects) ? Object.values(objects)
            .filter(filterExclusions)
            .map((o) => { return (o.object) ? o.object.name.en : undefined }).join(',') : ''

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

    function filterExclusions(gridObject: GridCharacter | GridWeapon | GridSummon) {
        if (objects && gridObject.object && 
            gridObject.object.granblue_id === objects[props.fromPosition]?.object.granblue_id)
                return null
        else return gridObject
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

        return (<ul id="Results">{elements}</ul>)
    }

    function renderSummonSearchResults(results: { [key: string]: any }) {
        const elements = results.map((result: Summon) => {
            return <SummonResult 
                key={result.id} 
                data={result} 
                onClick={() => { sendData(result) }} 
            />
        })

        return (<ul id="Results">{elements}</ul>)
    }

    function renderCharacterSearchResults(results: { [key: string]: any }) {
        const elements = results.map((result: Character) => {
            return <CharacterResult 
                key={result.id} 
                data={result} 
                onClick={() => { sendData(result) }} 
            />
        })

        return (<ul id="Results">{elements}</ul>)
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
                <Dialog.Content className="Search Dialog">
                    <div id="Header">
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
                        <Dialog.Close className="DialogClose" onClick={resetAndClose}>
                            <CrossIcon />
                        </Dialog.Close>
                    </div>
                    { ((Object.entries(results).length == 0) ? renderEmptyState() : renderResults()) }
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default SearchModal