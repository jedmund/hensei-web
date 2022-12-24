import React, { ForwardedRef, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Input from '~components/Input'
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

import classNames from 'classnames'

import { weaponAwakening, characterAwakening } from '~utils/awakening'
import type { Awakening } from '~utils/awakening'

import './index.scss'

interface Props {
  object: 'character' | 'weapon'
  awakeningType?: number
  awakeningLevel?: number
  sendValues: (type: number, level: number) => void
}

const AwakeningSelect = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)

  // Refs
  const awakeningLevelInput = React.createRef<HTMLInputElement>()

  // States
  const [awakeningType, setAwakeningType] = useState(-1)
  const [awakeningLevel, setAwakeningLevel] = useState(1)

  const [maxValue, setMaxValue] = useState(1)

  const [error, setError] = useState('')

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
    let defaultAwakening = 0
    if (props.object === 'weapon') defaultAwakening = -1

    setAwakeningType(
      props.awakeningType != undefined ? props.awakeningType : defaultAwakening
    )
    setAwakeningLevel(props.awakeningLevel ? props.awakeningLevel : 1)
  }, [props.object, props.awakeningType, props.awakeningLevel])

  useEffect(() => {
    props.sendValues(awakeningType, awakeningLevel)
  }, [props.sendValues, awakeningType, awakeningLevel])

  // Classes
  function changeOpen() {
    setOpen(!open)
  }

  function generateOptions(object: 'character' | 'weapon') {
    let options: Awakening[] = []
    if (object === 'character') options = characterAwakening
    else if (object === 'weapon') options = weaponAwakening
    else return

    let optionElements: React.ReactNode[] = options.map((awakening, i) => {
      return (
        <SelectItem key={i} value={awakening.id}>
          {awakening.name[locale]}
        </SelectItem>
      )
    })

    if (object === 'weapon') {
      optionElements?.unshift(
        <SelectItem key={-1} value={-1}>
          {t('ax.no_skill')}
        </SelectItem>
      )
    }

    return optionElements
  }

  function handleSelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    setAwakeningType(value)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(event.target.value)
    if (handleLevelError(value)) setAwakeningLevel(value)
  }

  function handleLevelError(value: number) {
    let error = ''
    if (value < 1) {
      error = t('awakening.errors.value_too_low', {
        minValue: 1,
      })
    } else if (value > maxValue) {
      error = t('awakening.errors.value_too_high', {
        maxValue: maxValue,
      })
    } else if (!value || value <= 0) {
      error = t('awakening.errors.value_empty')
    } else {
      error = ''
    }

    setError(error)

    return error.length === 0
  }

  const rangeString = (object: 'character' | 'weapon') => {
    let minValue = 1
    let maxValue = 1

    if (object === 'weapon') {
      minValue = 1
      maxValue = 15
    } else if (object === 'character') {
      minValue = 1
      maxValue = 9
    } else return

    return `${minValue}~${maxValue}`
  }

  return (
    <div className="AwakeningSelect">
      <div className="AwakeningSet">
        <div className="fields">
          <Select
            key="awakening_type"
            value={`${awakeningType}`}
            open={open}
            onValueChange={handleSelectChange}
            onClick={() => changeOpen()}
            triggerClass="modal"
          >
            {generateOptions(props.object)}
          </Select>

          <Input
            value={awakeningLevel}
            className={inputClasses}
            type="number"
            placeholder={rangeString(props.object)}
            min={1}
            max={maxValue}
            step="1"
            onChange={handleInputChange}
            ref={awakeningLevelInput}
          />
        </div>
        <p className={errorClasses}>{error}</p>
      </div>
    </div>
  )
}

export default AwakeningSelect
