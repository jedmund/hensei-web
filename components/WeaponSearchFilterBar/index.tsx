import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'

import cloneDeep from 'lodash.clonedeep'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import SearchFilter from '~components/SearchFilter'
import SearchFilterCheckboxItem from '~components/SearchFilterCheckboxItem'

import './index.scss'
import { emptyElementState, emptyProficiencyState, emptyRarityState, emptyWeaponSeriesState } from '~utils/emptyStates'
import { elements, proficiencies, rarities, weaponSeries } from '~utils/stateValues'

interface Props {
    sendFilters: (filters: { [key: string]: number[] }) => void
}

const WeaponSearchFilterBar = (props: Props) => {
    const { t } = useTranslation('common')

    const [rarityMenu, setRarityMenu] = useState(false)
    const [elementMenu, setElementMenu] = useState(false)
    const [proficiencyMenu, setProficiencyMenu] = useState(false)
    const [seriesMenu, setSeriesMenu] = useState(false)

    const [rarityState, setRarityState] = useState<RarityState>(emptyRarityState)
    const [elementState, setElementState] = useState<ElementState>(emptyElementState)
    const [proficiencyState, setProficiencyState] = useState<ProficiencyState>(emptyProficiencyState)
    const [seriesState, setSeriesState] = useState<WeaponSeriesState>(emptyWeaponSeriesState)

    function rarityMenuOpened(open: boolean) {
        if (open) {
            setRarityMenu(true)
            setElementMenu(false)
            setProficiencyMenu(false)
            setSeriesMenu(false)
        } else setRarityMenu(false)
    }

    function elementMenuOpened(open: boolean) {
        if (open) {
            setRarityMenu(false)
            setElementMenu(true)
            setProficiencyMenu(false)
            setSeriesMenu(false)
        } else setElementMenu(false)
    }

    function proficiencyMenuOpened(open: boolean) {
        if (open) {
            setRarityMenu(false)
            setElementMenu(false)
            setProficiencyMenu(true)
            setSeriesMenu(false)
        } else setProficiencyMenu(false)
    }

    function seriesMenuOpened(open: boolean) {
        if (open) {
            setRarityMenu(false)
            setElementMenu(false)
            setProficiencyMenu(false)
            setSeriesMenu(true)
        } else setSeriesMenu(false)
    }

    function handleRarityChange(checked: boolean, key: string) {
        let newRarityState = cloneDeep(rarityState)
        newRarityState[key].checked = checked
        setRarityState(newRarityState)
    }

    function handleElementChange(checked: boolean, key: string) {
        let newElementState = cloneDeep(elementState)
        newElementState[key].checked = checked
        setElementState(newElementState)
    }

    function handleProficiencyChange(checked: boolean, key: string) {
        let newProficiencyState = cloneDeep(proficiencyState)
        newProficiencyState[key].checked = checked
        setProficiencyState(newProficiencyState)
    }

    function handleSeriesChange(checked: boolean, key: string) {
        let newSeriesState = cloneDeep(seriesState)
        newSeriesState[key].checked = checked
        setSeriesState(newSeriesState)
    }

    function sendFilters() {
        const checkedRarityFilters = Object.values(rarityState).filter(x => x.checked).map((x, i) => x.id)
        const checkedElementFilters = Object.values(elementState).filter(x => x.checked).map((x, i) => x.id)
        const checkedProficiencyFilters = Object.values(proficiencyState).filter(x => x.checked).map((x, i) => x.id)
        const checkedSeriesFilters = Object.values(seriesState).filter(x => x.checked).map((x, i) => x.id)
        
        const filters = {
            rarity: checkedRarityFilters,
            element: checkedElementFilters,
            proficiency1: checkedProficiencyFilters,
            series: checkedSeriesFilters
        }

        props.sendFilters(filters)
    }

    useEffect(() => {
        sendFilters()
    }, [rarityState, elementState, proficiencyState, seriesState])

    return (
        <div className="SearchFilterBar">
            <SearchFilter label={t('filters.labels.rarity')} numSelected={Object.values(rarityState).map(x => x.checked).filter(Boolean).length} open={rarityMenu} onOpenChange={rarityMenuOpened}>
                <DropdownMenu.Label className="Label">{t('filters.labels.rarity')}</DropdownMenu.Label>
                { Array.from(Array(rarities.length)).map((x, i) => {
                    return (
                        <SearchFilterCheckboxItem 
                            key={rarities[i]}
                            onCheckedChange={handleRarityChange} 
                            checked={rarityState[rarities[i]].checked} 
                            valueKey={rarities[i]}>
                                {t(`rarities.${rarities[i]}`)}
                        </SearchFilterCheckboxItem>
                    )}
                ) }
            </SearchFilter>

            <SearchFilter label={t('filters.labels.element')} numSelected={Object.values(elementState).map(x => x.checked).filter(Boolean).length} open={elementMenu} onOpenChange={elementMenuOpened}>
                <DropdownMenu.Label className="Label">{t('filters.labels.element')}</DropdownMenu.Label>
                { Array.from(Array(elements.length)).map((x, i) => {
                    return (
                        <SearchFilterCheckboxItem 
                            key={elements[i]}
                            onCheckedChange={handleElementChange} 
                            checked={elementState[elements[i]].checked} 
                            valueKey={elements[i]}>
                                {t(`elements.${elements[i]}`)}
                        </SearchFilterCheckboxItem>
                    )}
                ) }
            </SearchFilter>

            <SearchFilter label={t('filters.labels.proficiency')} numSelected={Object.values(proficiencyState).map(x => x.checked).filter(Boolean).length} open={proficiencyMenu} onOpenChange={proficiencyMenuOpened}>
                <DropdownMenu.Label className="Label">{t('filters.labels.proficiency')}</DropdownMenu.Label>
                <section>
                    <DropdownMenu.Group className="Group">
                        { Array.from(Array(proficiencies.length / 2)).map((x, i) => {
                            return (
                                <SearchFilterCheckboxItem 
                                    key={proficiencies[i]}
                                    onCheckedChange={handleProficiencyChange} 
                                    checked={proficiencyState[proficiencies[i]].checked} 
                                    valueKey={proficiencies[i]}>
                                        {t(`proficiencies.${proficiencies[i]}`)}
                                </SearchFilterCheckboxItem>
                            )}
                        ) }
                    </DropdownMenu.Group>
                    <DropdownMenu.Group className="Group">
                        { Array.from(Array(proficiencies.length / 2)).map((x, i) => {
                            return (
                                <SearchFilterCheckboxItem 
                                    key={proficiencies[i + (proficiencies.length / 2)]}
                                    onCheckedChange={handleProficiencyChange} 
                                    checked={proficiencyState[proficiencies[i + (proficiencies.length / 2)]].checked} 
                                    valueKey={proficiencies[i + (proficiencies.length / 2)]}>
                                        {t(`proficiencies.${proficiencies[i + (proficiencies.length / 2)]}`)}
                                </SearchFilterCheckboxItem>
                            )}
                        ) }
                    </DropdownMenu.Group>
                </section>
            </SearchFilter>

            <SearchFilter label={t('filters.labels.series')} numSelected={Object.values(seriesState).map(x => x.checked).filter(Boolean).length} open={seriesMenu} onOpenChange={seriesMenuOpened}>
                <DropdownMenu.Label className="Label">{t('filters.labels.series')}</DropdownMenu.Label>
                <section>
                    <DropdownMenu.Group className="Group">
                        { Array.from(Array(weaponSeries.length / 3)).map((x, i) => {
                            return (
                                <SearchFilterCheckboxItem 
                                    key={weaponSeries[i]}
                                    onCheckedChange={handleSeriesChange} 
                                    checked={seriesState[weaponSeries[i]].checked} 
                                    valueKey={weaponSeries[i]}>
                                        {t(`series.${weaponSeries[i]}`)}
                                </SearchFilterCheckboxItem>
                            )}
                        ) }
                    </DropdownMenu.Group>
                    <DropdownMenu.Group className="Group">
                        { Array.from(Array(weaponSeries.length / 3)).map((x, i) => {
                            return (
                                <SearchFilterCheckboxItem 
                                    key={weaponSeries[i + (weaponSeries.length / 3)]}
                                    onCheckedChange={handleSeriesChange} 
                                    checked={seriesState[weaponSeries[i + (weaponSeries.length / 3)]].checked} 
                                    valueKey={weaponSeries[i + (weaponSeries.length / 3)]}>
                                        {t(`series.${weaponSeries[i + (weaponSeries.length / 3)]}`)}
                                </SearchFilterCheckboxItem>
                            )}
                        ) }
                    </DropdownMenu.Group>
                    <DropdownMenu.Group className="Group">
                        { Array.from(Array(weaponSeries.length / 3)).map((x, i) => {
                            return (
                                <SearchFilterCheckboxItem 
                                    key={weaponSeries[i + (2 * (weaponSeries.length / 3))]}
                                    onCheckedChange={handleSeriesChange} 
                                    checked={seriesState[weaponSeries[i + (2 * (weaponSeries.length / 3))]].checked} 
                                    valueKey={weaponSeries[i + (2 * (weaponSeries.length / 3))]}>
                                        {t(`series.${weaponSeries[i + (2 * (weaponSeries.length / 3))]}`)}
                                </SearchFilterCheckboxItem>
                            )}
                        ) }
                    </DropdownMenu.Group>
                </section>
            </SearchFilter>
        </div>
    )
}

export default WeaponSearchFilterBar
