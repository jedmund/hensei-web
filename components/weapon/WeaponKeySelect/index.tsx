import React, { useEffect, useState } from 'react'

import Select from '~components/common/Select'
import SelectGroup from '~components/common/SelectGroup'
import SelectItem from '~components/common/SelectItem'

import { appState } from '~utils/appState'

import styles from './index.module.scss'

// Props
interface Props {
  open: boolean
  weaponKey?: WeaponKey
  series: number
  slot: number
  onChange?: (value: WeaponKey, slot: number) => void
  onOpenChange: () => void
  onClose?: () => void
}

// Constants
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

const emptyWeaponKey: WeaponKey = {
  id: 'no-key',
  granblue_id: '-1',
  series: 0,
  slot: 0,
  slug: '',
  group: 0,
  order: 0,
  name: { en: '', ja: '' },
}

const WeaponKeySelect = React.forwardRef<HTMLButtonElement, Props>(
  function useFieldSet(
    { open, weaponKey, series, slot, onChange, onOpenChange, onClose },
    ref
  ) {
    const [keys, setKeys] = useState<WeaponKey[][]>([])

    useEffect(() => {
      const keys = flattenWeaponKeys()
      const filteredKeys = filterWeaponKeys(keys)
      setKeys(groupWeaponKeys(filteredKeys))
    }, [series])

    function flattenWeaponKeys() {
      const keys: WeaponKey[] = []

      for (let setName of Object.keys(appState.weaponKeys)) {
        const set = appState.weaponKeys[setName]
        set.map((key) => keys.push(key))
      }

      return keys
    }

    function filterWeaponKeys(weaponKeys: WeaponKey[]) {
      // Filter weapon keys based on the series and slot provided
      return weaponKeys.filter(
        (key) => key.series == series && key.slot == slot
      )
    }

    function groupWeaponKeys(weaponKeys: WeaponKey[]) {
      const numGroups = Math.max.apply(
        Math,
        weaponKeys.map((key) => key.group)
      )
      let groupedKeys = []
      for (let i = 0; i <= numGroups; i++) {
        const values = weaponKeys.filter((key) => key.group == i)
        if (values.length > 0) groupedKeys[i] = values
      }

      return groupedKeys.filter(() => true)
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
            <SelectItem
              key={i}
              value={item.id}
              data-granblue-id={item.granblue_id}
            >
              {item.name.en}
            </SelectItem>
          )
        })

      let name: { [key: string]: string } = {}
      if (series == 2 && index == 0) name = pendulumNames[0]
      else if (series == 2 && slot == 1 && index == 1) name = pendulumNames[1]
      else if (series === 3) name = telumaNames[0]
      else if (series === 17) name = gauphNames[slot]
      else if (series === 24) name = emblemNames[index]

      return (
        <SelectGroup
          key={index}
          label={series == 17 && slot == 2 ? name.en : `${name.en}s`}
          separator={false}
        >
          {options}
        </SelectGroup>
      )
    }

    function handleChange(value: string) {
      const keys = flattenWeaponKeys()
      const found = keys.find((key) => key.id == value)
      const weaponKey = found ? found : emptyWeaponKey
      if (onChange) onChange(weaponKey, slot)
    }

    const emptyOption = () => {
      let name = ''
      if (series === 2) name = pendulumNames[0].en
      else if (series === 3) name = telumaNames[0].en
      else if (series === 17) name = gauphNames[slot].en
      else if (series === 24) name = emblemNames[0].en

      return `No ${name}`
    }

    return (
      <Select
        key={`weapon-key-${slot}`}
        value={weaponKey ? weaponKey.id : emptyWeaponKey.id}
        open={open}
        onClose={onClose}
        onOpenChange={onOpenChange}
        onValueChange={handleChange}
        trigger={{
          bound: true,
        }}
        ref={ref}
        overlayVisible={false}
      >
        <SelectItem key={emptyWeaponKey.id} value={emptyWeaponKey.id}>
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
