import React, { useEffect, useState } from 'react'
import cloneDeep from 'lodash.clonedeep'

import SelectWithInput from '~components/common/SelectWithInput'
import { weaponAwakening, characterAwakening } from '~data/awakening'

import './index.scss'

interface Props {
  object: 'character' | 'weapon'
  type?: number
  level?: number
  onOpenChange?: (open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (type: number, level: number) => void
}

const AwakeningSelect = (props: Props) => {
  // Data states
  const [awakeningType, setAwakeningType] = useState(
    props.object === 'weapon' ? 0 : 1
  )
  const [awakeningLevel, setAwakeningLevel] = useState(1)

  // Data
  const chooseDataset = () => {
    let list: ItemSkill[] = []

    switch (props.object) {
      case 'character':
        list = characterAwakening
        break
      case 'weapon':
        // WARNING: Clonedeep is masking a deeper error
        // which is running this method every time this component is rerendered
        // causing multiple "No awakening" items to be added
        const awakening = cloneDeep(weaponAwakening)
        awakening.unshift({
          id: 0,
          name: {
            en: 'No awakening',
            ja: '覚醒なし',
          },
          granblue_id: '',
          slug: 'no-awakening',
          minValue: 0,
          maxValue: 0,
          fractional: false,
        })
        list = awakening
        break
    }

    return list
  }

  // Set default awakening and level based on object type
  useEffect(() => {
    const defaultAwakening = props.object === 'weapon' ? 0 : 1
    const type = props.type != undefined ? props.type : defaultAwakening

    setAwakeningType(type)
    setAwakeningLevel(props.level ? props.level : 1)
  }, [props.object, props.type, props.level])

  // Send validity of form when awakening level changes
  useEffect(() => {
    props.sendValidity(awakeningLevel > 0)
  }, [props.sendValidity, awakeningLevel])

  // Classes
  function changeOpen(open: boolean) {
    if (props.onOpenChange) props.onOpenChange(open)
  }

  function handleValueChange(type: number, level: number) {
    setAwakeningType(type)
    setAwakeningLevel(level)
    props.sendValues(type, level)
  }

  return (
    <div className="Awakening">
      <SelectWithInput
        object={`${props.object}_awakening`}
        dataSet={chooseDataset()}
        selectValue={awakeningType}
        inputValue={awakeningLevel}
        onOpenChange={changeOpen}
        sendValidity={props.sendValidity}
        sendValues={handleValueChange}
      />
    </div>
  )
}

export default AwakeningSelect
