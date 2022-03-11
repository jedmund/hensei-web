import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'

import { appState } from '~utils/appState'
import api from '~utils/api'

import * as Dialog from '@radix-ui/react-dialog'

import CharacterSearchFilterBar from '~components/CharacterSearchFilterBar'
import WeaponSearchFilterBar from '~components/WeaponSearchFilterBar'
import SummonSearchFilterBar from '~components/SummonSearchFilterBar'

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

    const router = useRouter()
    const locale = router.locale

    const { t } = useTranslation('common')

    let searchInput = React.createRef<HTMLInputElement>()
    let scrollContainer = React.createRef<HTMLDivElement>()

    const [objects, setObjects] = useState<{[id: number]: GridCharacter | GridWeapon | GridSummon}>()
    const [filters, setFilters] = useState<{ [key: string]: number[] }>()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<(Weapon | Summon | Character)[]>([])

    // Pagination states
    const [recordCount, setRecordCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

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
        } else {
            setQuery('')
        }
    }
    
    function fetchResults({ replace = false }: { replace?: boolean }) {
        api.search({
            object: props.object, 
            query: query, 
            filters: filters, 
            locale: locale, 
            page: currentPage
        }).then(response => {
            setTotalPages(response.data.total_pages)
            setRecordCount(response.data.count)

            if (replace) {
                replaceResults(response.data.count, response.data.results)
            } else {
                appendResults(response.data.results)
            }
        }).catch(error => {
            console.error(error)
        }) 
    }

    function replaceResults(count: number, list: Weapon[] | Summon[] | Character[]) {
        if (count > 0) {
            setResults(list)
        } else {
            setResults([])
        }
    }

    function appendResults(list: Weapon[] | Summon[] | Character[]) {
        setResults([...results, ...list])
    }

    function sendData(result: Character | Weapon | Summon) {
        props.send(result, props.fromPosition)
        setOpen(false)
    }

    function receiveFilters(filters: { [key: string]: number[] }) {
        setCurrentPage(1)
        setResults([])
        setFilters(filters)
    }

    useEffect(() => {
        // Current page changed
        if (open && currentPage > 1) {
            fetchResults({ replace: false })
        } else if (open && currentPage == 1) {
            fetchResults({ replace: true })
        }
    }, [currentPage])

    useEffect(() => {
        // Filters changed
        if (open) {
            setCurrentPage(1)
            fetchResults({ replace: true })
        }
    }, [filters])

    useEffect(() => {
        // Query changed
        if (open && query.length != 1) {
            setCurrentPage(1)
            fetchResults({ replace: true })
        }
    }, [query])

    function renderResults() {
        let jsx

        switch(props.object) {
            case 'weapons':
                jsx = renderWeaponSearchResults()
                break
            case 'summons':
                jsx = renderSummonSearchResults(results)
                break
            case 'characters':
                jsx = renderCharacterSearchResults(results) 
                break
        }

        return (
            <InfiniteScroll
                dataLength={ (results && results.length > 0) ? results.length : 0}
                next={ () => setCurrentPage(currentPage + 1) }
                hasMore={totalPages > currentPage}
                scrollableTarget="Results"
                loader={<div className="footer">Loading...</div>}>
                    {jsx}
            </InfiniteScroll>
        )
    }

    function renderWeaponSearchResults() {
        let jsx: React.ReactNode
        
        const castResults: Weapon[] = results as Weapon[]
        if (castResults && Object.keys(castResults).length > 0) {
            jsx = castResults.map((result: Weapon) => {
                return <WeaponResult 
                    key={result.id} 
                    data={result} 
                    onClick={() => { sendData(result) }} 
                />
            })
        }

        return jsx
    }

    function renderSummonSearchResults(results: { [key: string]: any }) {
        let jsx: React.ReactNode
        
        const castResults: Summon[] = results as Summon[]
        if (castResults && Object.keys(castResults).length > 0) {
            jsx = castResults.map((result: Summon) => {
                return <SummonResult 
                    key={result.id} 
                    data={result} 
                    onClick={() => { sendData(result) }} 
                />
            })
        }

        return jsx
    }

    function renderCharacterSearchResults(results: { [key: string]: any }) {
        let jsx: React.ReactNode
        
        const castResults: Character[] = results as Character[]
        if (castResults && Object.keys(castResults).length > 0) {
            jsx = castResults.map((result: Character) => {
                return <CharacterResult 
                    key={result.id} 
                    data={result} 
                    onClick={() => { sendData(result) }} 
                />
            })
        }

        return jsx
    }
    
    function openChange() {
        if (open) {
            setQuery('')
            setResults([])
            setOpen(false)
        } else {
            setOpen(true)
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                {props.children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Search Dialog">
                    <div id="Header">
                        <div id="Bar">
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
                            <Dialog.Close className="DialogClose" onClick={openChange}>
                                <CrossIcon />
                            </Dialog.Close>
                        </div>
                        { (props.object === 'characters') ? <CharacterSearchFilterBar sendFilters={receiveFilters} /> : '' }
                        { (props.object === 'weapons') ? <WeaponSearchFilterBar sendFilters={receiveFilters} /> : '' }
                        { (props.object === 'summons') ? <SummonSearchFilterBar sendFilters={receiveFilters} /> : '' }
                    </div>

                    <div id="Results" ref={scrollContainer}>
                        <h5 className="total">{t('search.result_count', { "record_count": recordCount })}</h5>
                        { (open) ? renderResults() : ''}
                    </div>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default SearchModal