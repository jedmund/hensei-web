import React, { useState } from 'react'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'

import * as Dialog from '@radix-ui/react-dialog'

import AXSelect from '~components/AxSelect'
import ElementToggle from '~components/ElementToggle'
import WeaponKeyDropdown from '~components/WeaponKeyDropdown'
import Button from '~components/Button'

import api from '~utils/api'
import { appState } from '~utils/appState'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface GridWeaponObject {
    weapon: {
        element?: number
        weapon_key1_id?: string
        weapon_key2_id?: string
        weapon_key3_id?: string
        ax_modifier1?: number
        ax_modifier2?: number
        ax_strength1?: number
        ax_strength2?: number
    }
}

interface Props {
    gridWeapon: GridWeapon
    children: React.ReactNode
}

const WeaponModal = (props: Props) => {
    const router = useRouter()
    const locale = (router.locale && ['en', 'ja'].includes(router.locale)) ? router.locale : 'en'
    const { t } = useTranslation('common')
    
    // Cookies
    const [cookies] = useCookies(['account'])
    const headers = (cookies.account != null) ? {
        headers: {
            'Authorization': `Bearer ${cookies.account.access_token}`
        }
    } : {}
    
    // Refs
    const weaponKey1Select = React.createRef<HTMLSelectElement>()
    const weaponKey2Select = React.createRef<HTMLSelectElement>()
    const weaponKey3Select = React.createRef<HTMLSelectElement>()

    // State
    const [open, setOpen] = useState(false)
    const [formValid, setFormValid] = useState(false)

    const [element, setElement] = useState(-1)
    const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
    const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
    const [primaryAxValue, setPrimaryAxValue] = useState(0.0)
    const [secondaryAxValue, setSecondaryAxValue] = useState(0.0)
    
    function receiveAxValues(primaryAxModifier: number, primaryAxValue: number, secondaryAxModifier: number, secondaryAxValue: number) {
        setPrimaryAxModifier(primaryAxModifier)
        setSecondaryAxModifier(secondaryAxModifier)

        setPrimaryAxValue(primaryAxValue)
        setSecondaryAxValue(secondaryAxValue)
    }

    function receiveAxValidity(isValid: boolean) {
        setFormValid(isValid)
    }

    function receiveElementValue(element: string) {
        setElement(parseInt(element))
    }

    function prepareObject() {
        let object: GridWeaponObject = { weapon: {} }

        if (props.gridWeapon.object.element == 0)
            object.weapon.element = element

        if ([2, 3, 17, 24].includes(props.gridWeapon.object.series))
            object.weapon.weapon_key1_id = weaponKey1Select.current?.value

        if ([2, 3, 17].includes(props.gridWeapon.object.series))
            object.weapon.weapon_key2_id = weaponKey2Select.current?.value

        if (props.gridWeapon.object.series == 17)
            object.weapon.weapon_key3_id = weaponKey3Select.current?.value

        if (props.gridWeapon.object.ax > 0) {
            object.weapon.ax_modifier1 = primaryAxModifier
            object.weapon.ax_modifier2 = secondaryAxModifier
            object.weapon.ax_strength1 = primaryAxValue
            object.weapon.ax_strength2 = secondaryAxValue
        }

        return object
    }

    async function updateWeapon() {
        const updateObject = prepareObject()
        return await api.endpoints.grid_weapons.update(props.gridWeapon.id, updateObject, headers)
            .then(response => processResult(response))
            .catch(error => processError(error))
    }

    function processResult(response: AxiosResponse) {
        const gridWeapon: GridWeapon = response.data.grid_weapon

        if (gridWeapon.mainhand)
            appState.grid.weapons.mainWeapon = gridWeapon
        else
            appState.grid.weapons.allWeapons[gridWeapon.position] = gridWeapon

        setOpen(false)
    }

    function processError(error: any) {
        console.error(error)
    }

    const elementSelect = () => {
        return (
            <section>
                <h3>{t('modals.weapon.subtitles.element')}</h3>
                <ElementToggle 
                    currentElement={props.gridWeapon.element} 
                    sendValue={receiveElementValue}
                />
            </section>
        )
    }

    const keySelect = () => {        
        return (
            <section>
                <h3>{t('modals.weapon.subtitles.weapon_keys')}</h3>
                { ([2, 3, 17, 22].includes(props.gridWeapon.object.series)) ? 
                    <WeaponKeyDropdown
                        currentValue={ (props.gridWeapon.weapon_keys) ? props.gridWeapon.weapon_keys[0] : undefined }
                        series={props.gridWeapon.object.series}
                        slot={0} 
                        ref={weaponKey1Select} />
                        : ''}

                { ([2, 3, 17].includes(props.gridWeapon.object.series)) ? 
                    <WeaponKeyDropdown 
                        currentValue={ (props.gridWeapon.weapon_keys) ? props.gridWeapon.weapon_keys[1] : undefined }
                        series={props.gridWeapon.object.series}
                        slot={1}
                        ref={weaponKey2Select} />
                        : ''}

                { (props.gridWeapon.object.series == 17) ? 
                    <WeaponKeyDropdown 
                        currentValue={ (props.gridWeapon.weapon_keys) ? props.gridWeapon.weapon_keys[2] : undefined } 
                        series={props.gridWeapon.object.series}
                        slot={2}
                        ref={weaponKey3Select} />
                        : ''}
            </section>
        )
    }

    const axSelect = () => {
        return (
            <section>
                <h3>{t('modals.weapon.subtitles.ax_skills')}</h3>
                <AXSelect 
                    axType={props.gridWeapon.object.ax}
                    currentSkills={props.gridWeapon.ax}
                    sendValidity={receiveAxValidity}
                    sendValues={receiveAxValues}    
                />
            </section>
        )
    }

    function openChange(open: boolean) {
        setFormValid(false)
        setOpen(open)
    }
    
    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                { props.children }
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Weapon Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <div className="DialogTop">
                            <Dialog.Title className="SubTitle">{t('modals.weapon.title')}</Dialog.Title>
                            <Dialog.Title className="DialogTitle">{props.gridWeapon.object.name[locale]}</Dialog.Title>
                        </div>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>

                    <div className="mods">
                        { (props.gridWeapon.object.element == 0) ? elementSelect() : '' }
                        { ([2, 3, 17, 24].includes(props.gridWeapon.object.series)) ? keySelect() : '' }
                        { (props.gridWeapon.object.ax > 0) ? axSelect() : '' }
                        <Button onClick={updateWeapon} disabled={props.gridWeapon.object.ax > 0 && !formValid}>{t('modals.weapon.buttons.confirm')}</Button>
                    </div>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default WeaponModal