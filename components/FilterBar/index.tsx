import React from 'react'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import RaidDropdown from '~components/RaidDropdown'

import { appState } from '~utils/appState'

import './index.scss'
import { raidGroups } from '~utils/raidGroups'

interface Props {
    children: React.ReactNode
    scrolled: boolean
    element?: number
    raidSlug?: string
    recency?: number
    onFilter: ({element, raid, recency} : { element?: number, raid?: Raid, recency?: number}) => void
}

const FilterBar = (props: Props) => { 
    // Set up translation
    const { t } = useTranslation('common')

    // Set up state object
    const app = useSnapshot(appState)

    // Set up refs for filter dropdowns
    const elementSelect = React.createRef<HTMLSelectElement>()
    const raidSelect = React.createRef<HTMLSelectElement>()
    const recencySelect = React.createRef<HTMLSelectElement>()

    // Set up classes object for showing shadow on scroll
    const classes = classNames({
        'FilterBar': true,
        'shadow': props.scrolled
    })

    function elementSelectChanged() {
        const elementValue = (elementSelect.current) ? parseInt(elementSelect.current.value) : -1
        props.onFilter({ element: elementValue })
    }

    function recencySelectChanged() {
        const recencyValue = (recencySelect.current) ? parseInt(recencySelect.current.value) : -1
        props.onFilter({ recency: recencyValue })
    }

    function raidSelectChanged(raid?: Raid) {
        props.onFilter({ raid: raid })
    }

    return (
        <div className={classes}>
            {props.children}
            <select onChange={elementSelectChanged} ref={elementSelect} value={props.element}>
                <option data-element="all" key={-1} value={-1}>{t('elements.full.all')}</option>
                <option data-element="null" key={0} value={0}>{t('elements.full.null')}</option>
                <option data-element="wind" key={1} value={1}>{t('elements.full.wind')}</option>
                <option data-element="fire" key={2} value={2}>{t('elements.full.fire')}</option>
                <option data-element="water" key={3} value={3}>{t('elements.full.water')}</option>
                <option data-element="earth" key={4} value={4}>{t('elements.full.earth')}</option>
                <option data-element="dark" key={5} value={5}>{t('elements.full.dark')}</option>
                <option data-element="light" key={6} value={6}>{t('elements.full.light')}</option>
            </select>
            <RaidDropdown 
                showAllRaidsOption={true} 
                onChange={raidSelectChanged}
                ref={raidSelect}
            />
            <select onChange={recencySelectChanged} ref={recencySelect}>
                <option key={-1} value={-1}>{t('recency.all_time')}</option>
                <option key={86400} value={86400}>{t('recency.last_day')}</option>
                <option key={604800} value={604800}>{t('recency.last_week')}</option>
                <option key={2629746} value={2629746}>{t('recency.last_month')}</option>
                <option key={7889238} value={7889238}>{t('recency.last_3_months')}</option>
                <option key={15778476} value={15778476}>{t('recency.last_6_months')}</option>
                <option key={31556952} value={31556952}>{t('recency.last_year')}</option>
            </select>
        </div>
    )
}

export default FilterBar
