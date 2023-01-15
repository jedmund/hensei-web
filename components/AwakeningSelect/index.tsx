import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import SelectWithInput from '~components/SelectWithInput'
import SelectItem from '~components/SelectItem'

import classNames from 'classnames'

import { weaponAwakening, characterAwakening } from '~data/awakening'
import type { Awakening } from '~data/awakening'

import './index.scss'

interface Props {
  object: 'character' | 'weapon'
  awakeningType?: number
  awakeningLevel?: number
  onOpenChange?: (open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (type: number, level: number) => void
}

const AwakeningSelect = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)

  // States
  const [awakeningType, setAwakeningType] = useState(-1)
  const [awakeningLevel, setAwakeningLevel] = useState(1)

  const [maxValue, setMaxValue] = useState(1)

  const [error, setError] = useState('')

  // Data
  const dataSet = () => {
    if (props.object === 'character') return characterAwakening
    else {
      const weaponDataSet = weaponAwakening

      weaponDataSet.unshift({
        id: 0,
        name: {
          en: 'No awakening',
          ja: '覚醒なし',
        },
        slug: 'no-awakening',
        minValue: 0,
        maxValue: 0,
        fractional: false,
      })

      return weaponDataSet
    }
  }

  // Classes
  const inputClasses = classNames({
    Bound: true,
    Hidden: awakeningType === -1,
  })

  const errorClasses = classNames({
    errors: true,
    visible: error !== '',
  })

  // Set max value based on object type
  useEffect(() => {
    if (props.object === 'character') setMaxValue(9)
    else if (props.object === 'weapon') setMaxValue(15)
  }, [props.object])

  // Set default awakening and level based on object type
  useEffect(() => {
    let defaultAwakening = 1
    if (props.object === 'weapon') defaultAwakening = -1

    setAwakeningType(
      props.awakeningType != undefined ? props.awakeningType : defaultAwakening
    )
    setAwakeningLevel(props.awakeningLevel ? props.awakeningLevel : 1)
  }, [props.object, props.awakeningType, props.awakeningLevel])

  // Send awakening type and level when changed
  useEffect(() => {
    props.sendValues(awakeningType, awakeningLevel)
  }, [props.sendValues, awakeningType, awakeningLevel])

  // Send validity of form when awakening level changes
  useEffect(() => {
    props.sendValidity(awakeningLevel > 0 && error === '')
  }, [props.sendValidity, awakeningLevel, error])

  // Classes
  function changeOpen() {
    setOpen(!open)
    if (props.onOpenChange) props.onOpenChange(!open)
  }

  return (
    <div className="Awakening">
      <SelectWithInput
        object={`${props.object}_awakening`}
        dataSet={dataSet()}
        selectValue={awakeningType}
        inputValue={awakeningLevel}
        onOpenChange={changeOpen}
        sendValidity={props.sendValidity}
        sendValues={props.sendValues}
      />
    </div>
  )
}

export default AwakeningSelect
