import React, { useEffect, useState } from 'react'

import Select from '~components/Select'
import SelectGroup from '~components/SelectGroup'
import SelectItem from '~components/SelectItem'
import api from '~utils/api'

import './index.scss'

// Props
interface Props {
  currentValue?: WeaponKey
  series: number
  slot: number
  onChange?: (value: string, slot: number) => void
}

const WeaponKeySelect = React.forwardRef<HTMLButtonElement, Props>(
  function useFieldSet(props, ref) {
    const [open, setOpen] = useState(false)
    const [keys, setKeys] = useState<WeaponKey[][]>([])

    const pendulumNames = [
      { en: 'Pendulum', jp: 'ペンデュラム' },
      { en: 'Chain', jp: 'チェイン' },
    ]

    const telumaNames = [{ en: 'Teluma', jp: 'テルマ' }]
    const emblemNames = [{ en: 'Emblem', jp: 'エンブレム' }]
    const gauphNames = [
      { en: 'Gauph Key', jp: 'ガフスキー' },
      { en: 'Ultima Key', jp: 'ガフスキーΩ' },
      { en: 'Gate of Omnipotence', jp: 'ガフスキー' },
    ]

    useEffect(() => {
      const filterParams = {
        params: {
          series: props.series,
          slot: props.slot,
        },
      }

      function organizeWeaponKeys(weaponKeys: WeaponKey[]) {
        const numGroups = Math.max.apply(
          Math,
          weaponKeys.map((key) => key.group)
        )
        let groupedKeys = []
        for (let i = 0; i <= numGroups; i++) {
          const values = weaponKeys.filter((key) => key.group == i)
          if (values.length > 0) groupedKeys[i] = values
        }

        setKeys(groupedKeys.filter(() => true))
      }

      function fetchWeaponKeys() {
        api.endpoints.weapon_keys
          .getAll(filterParams)
          .then((response) => organizeWeaponKeys(response.data))
      }

      fetchWeaponKeys()
    }, [props.series, props.slot])

    function openSelect() {
      setOpen(!open)
    }

    function weaponKeyGroup(index: number) {
      ;['α', 'β', 'γ', 'Δ'].sort((a, b) => a.localeCompare(b, 'el'))

      const sortByOrder = (a: WeaponKey, b: WeaponKey) =>
        a.order > b.order ? 1 : -1

      const options =
        keys &&
        keys.length > 0 &&
        keys[index].length > 0 &&
        keys[index].sort(sortByOrder).map((item, i) => {
          return (
            <SelectItem key={i} value={item.id}>
              {item.name.en}
            </SelectItem>
          )
        })

      let name: { [key: string]: string } = {}
      if (props.series == 2 && index == 0) name = pendulumNames[0]
      else if (props.series == 2 && props.slot == 1 && index == 1)
        name = pendulumNames[1]
      else if (props.series == 3) name = telumaNames[0]
      else if (props.series == 17) name = gauphNames[props.slot]
      else if (props.series == 22) name = emblemNames[index]

      return (
        <SelectGroup
          key={index}
          label={
            props.series == 17 && props.slot == 2 ? name.en : `${name.en}s`
          }
          separator={false}
        >
          {options}
        </SelectGroup>
      )
    }

    function handleChange(value: string) {
      if (props.onChange) props.onChange(value, props.slot)
    }

    const emptyOption = () => {
      let name = ''
      if (props.series == 2) name = pendulumNames[0].en
      else if (props.series == 3) name = telumaNames[0].en
      else if (props.series == 17) name = gauphNames[props.slot].en
      else if (props.series == 22) name = emblemNames[0].en

      return `No ${name}`
    }

    return (
      <Select
        key={`weapon-key-${props.slot}`}
        value={props.currentValue ? props.currentValue.id : 'no-key'}
        open={open}
        onValueChange={handleChange}
        onClick={openSelect}
        ref={ref}
        triggerClass="modal"
      >
        <SelectItem key="no-key" value="no-key">
          {emptyOption()}
        </SelectItem>
        {Array.from(Array(keys?.length)).map((x, i) => {
          return weaponKeyGroup(i)
        })}
      </Select>
    )
  }
)

export default WeaponKeySelect
