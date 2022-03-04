import React, { useEffect, useState } from 'react'

import api from '~utils/api'

import './index.scss'

// Props
interface Props {
    currentValue?: WeaponKey
    series: number
    slot: number
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
    onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

const WeaponKeyDropdown = React.forwardRef<HTMLSelectElement, Props>(function useFieldSet(props, ref) {
    const [keys, setKeys] = useState<WeaponKey[][]>([])
    const [currentKey, setCurrentKey] = useState('')

    const pendulumNames = [
        { en: 'Pendulum', jp: '' },
        { en: 'Chain', jp: '' }
    ]

    const telumaNames = [ { en: 'Teluma', jp: '' } ]
    const emblemNames = [ { en: 'Emblem', jp: '' } ]
    const gauphNames = [
        { en: 'Gauph Key', jp: '' },
        { en: 'Ultima Key', jp: '' },
        { en: 'Gate of Omnipotence', jp: '' }
    ]

    useEffect(() => {
        if (props.currentValue)
            setCurrentKey(props.currentValue.id)
    }, [props.currentValue])

    useEffect(() => {
        const filterParams = {
            params: {
                series: props.series,
                slot: props.slot
            }
        }

        function organizeWeaponKeys(weaponKeys: WeaponKey[]) {
            const numGroups = Math.max.apply(Math, weaponKeys.map(key => key.group))
            let groupedKeys = []
            for (let i = 0; i <= numGroups; i++) {
                groupedKeys[i] = weaponKeys.filter(key => key.group == i)
            }
    
            setKeys(groupedKeys)
        }

        function fetchWeaponKeys() {
            api.endpoints.weapon_keys.getAll(filterParams)
                .then((response) => {
                    const keys = response.data.map((k: any) => k.weapon_key)
                    organizeWeaponKeys(keys)
                })
        }

        fetchWeaponKeys()
    }, [props.series, props.slot])

    function weaponKeyGroup(index: number) {
        ['α','β','γ','Δ'].sort((a, b) => a.localeCompare(b, 'el'))

        const sortByOrder = (a: WeaponKey, b: WeaponKey) => a.order > b.order ? 1 : -1

        const options = keys && keys.length > 0 && keys[index].length > 0 && 
            keys[index].sort(sortByOrder).map((item, i) => {
                return (
                    <option key={i} value={item.id}>{item.name.en}</option>
                )
            })

        let name: { [key: string]: string } = {}
        if (props.series == 2 && index == 0) 
            name = pendulumNames[0]
        else if (props.series == 2 && props.slot == 1 && index == 1)
            name = pendulumNames[1]
        else if (props.series == 3)
            name = telumaNames[index]
        else if (props.series == 17)
            name = gauphNames[props.slot]
        else if (props.series == 22)
            name = emblemNames[index]
        
        return (
            <optgroup key={index} label={ (props.series == 17 && props.slot == 2) ? name.en : `${name.en}s`}>
                {options}
            </optgroup>
        )
    }

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        if (props.onChange)
            props.onChange(event)

        setCurrentKey(event.currentTarget.value)
    }

    const emptyOption = () => {
        let name = ''
        if (props.series == 2) 
            name = pendulumNames[0].en
        else if (props.series == 3)
            name = telumaNames[0].en
        else if (props.series == 17)
            name = gauphNames[props.slot].en
        else if (props.series == 22)
            name = emblemNames[0].en

        return `No ${name}`
    }
    
    return (
        <select 
            key={`weapon-key-${props.slot}`} 
            value={currentKey} 
            onBlur={props.onBlur} 
            onChange={handleChange} 
            ref={ref}>
                <option key="-1" value="-1">{ emptyOption() }</option>
                { Array.from(Array(keys?.length)).map((x, i) => {
                    return weaponKeyGroup(i)
                })}
        </select>
    )
})

export default WeaponKeyDropdown
