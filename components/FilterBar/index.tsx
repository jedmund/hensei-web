import React from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import RaidDropdown from '~components/RaidDropdown'

import './index.scss'

interface Props {
    children: React.ReactNode
    scrolled: boolean
    onFilter: (element?: number, raid?: string, recency?: number) => void
}

const FilterBar = (props: Props) => { 
    const { t } = useTranslation('common')

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
            {props.children}
            <select onChange={selectChanged} ref={elementSelect}>
                <option key={-1} value={-1}>{t('elements.full.all')}</option>
                <option key={-0} value={0}>{t('elements.full.null')}</option>
                <option key={1}value={1}>{t('elements.full.wind')}</option>
                <option key={2}value={2}>{t('elements.full.fire')}</option>
                <option key={3}value={3}>{t('elements.full.water')}</option>
                <option key={4}value={4}>{t('elements.full.earth')}</option>
                <option key={5}value={5}>{t('elements.full.dark')}</option>
                <option key={6}value={6}>{t('elements.full.light')}</option>
            </select>
            <RaidDropdown 
                allOption={true} 
                onChange={selectChanged} 
                ref={raidSelect}
            />
            <select onChange={selectChanged} ref={recencySelect}>
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
