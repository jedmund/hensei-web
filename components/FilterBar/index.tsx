import React from 'react'
import classNames from 'classnames'

import RaidDropdown from '~components/RaidDropdown'

import './index.scss'

interface Props {
    name: string
    scrolled: boolean
    onFilter: (element?: number, raid?: string, recency?: number) => void
}

const FilterBar = (props: Props) => { 
    const elementSelect = React.createRef<HTMLSelectElement>()
    const raidSelect = React.createRef<HTMLSelectElement>()
    const recencySelect = React.createRef<HTMLSelectElement>()

    const classes = classNames({
        'FilterBar': true,
        'shadow': props.scrolled
    })

    function selectChanged(event: React.ChangeEvent<HTMLSelectElement>) {
        const elementValue = (elementSelect.current) ? parseInt(elementSelect.current.value) : -1
        const raidValue = (raidSelect.current) ? raidSelect.current.value : ''
        const recencyValue = (recencySelect.current) ? parseInt(recencySelect.current.value) : -1

        props.onFilter(elementValue, raidValue, recencyValue)
    }

    return (
        <div className={classes}>
            <h1>{props.name}</h1>
            <select onChange={selectChanged} ref={elementSelect}>
                <option key={-1} value={-1}>All elements</option>
                <option key={-0} value={0}>Null</option>
                <option key={1}value={1}>Wind</option>
                <option key={2}value={2}>Fire</option>
                <option key={3}value={3}>Water</option>
                <option key={4}value={4}>Earth</option>
                <option key={5}value={5}>Dark</option>
                <option key={6}value={6}>Light</option>
            </select>
            <RaidDropdown 
                allOption={true} 
                onChange={selectChanged} 
                ref={raidSelect}
            />
            <select onChange={selectChanged} ref={recencySelect}>
                <option key={-1} value={-1}>All time</option>
                <option key={86400} value={86400}>Last day</option>
                <option key={604800} value={604800}>Last week </option>
                <option key={2629746} value={2629746}>Last month</option>
                <option key={7889238} value={7889238}>Last 3 months</option>
                <option key={15778476} value={15778476}>Last 6 months</option>
                <option key={31556952} value={31556952}>Last year</option>
            </select>
        </div>
    )
}

export default FilterBar
