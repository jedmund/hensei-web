'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'

// UI Dependencies
import Input from '~components/common/Input'
import Select from '~components/common/Select'
import SelectItem from '~components/common/SelectItem'

// Styles and icons
import styles from './index.module.scss'

// Types
interface Props {
  dataSet: Awakening[]
  defaultAwakening: Awakening
  awakening?: Awakening
  level?: number
  maxLevel: number
  selectDisabled: boolean
  onOpenChange?: (open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (type: string, level: number) => void
}

const defaultProps = {
  selectDisabled: false,
}

const AwakeningSelectWithInput = ({
  dataSet,
  defaultAwakening,
  awakening,
  level,
  maxLevel,
  selectDisabled,
  onOpenChange,
  sendValidity,
  sendValues,
}: Props) => {
  // Set up translations
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'
  const t = useTranslations('common')

  // State: Component
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  // State: Data
  const [currentAwakening, setCurrentAwakening] = useState<Awakening>()
  const [currentLevel, setCurrentLevel] = useState(1)

  // Refs
  const inputRef = React.createRef<HTMLInputElement>()

  // Classes
  const inputClasses = classNames({
    fullHeight: true,
    range: true,
  })

  const errorClasses = classNames({
    [styles.errors]: true,
    [styles.visible]: error !== '',
  })

  // Hooks
  useEffect(() => {
    setCurrentAwakening(awakening)
    setCurrentLevel(level ? level : 1)

    // If there is an awakening (even if it's the default) we consider the field valid.
    if (awakening || defaultAwakening) sendValidity(true)
  }, [])

  // Methods: UI state management
  function changeOpen() {
    if (!selectDisabled) {
      setOpen(!open)
      if (onOpenChange) onOpenChange(!open)
    }
  }

  function onClose() {
    if (onOpenChange) onOpenChange(false)
  }

  // Methods: Rendering
  function generateOptions() {
    const sortedDataSet = [...dataSet].sort((a, b) => a.order - b.order)
    let options: React.ReactNode[] = sortedDataSet.map((awakening) =>
      generateItem(awakening)
    )
    if (!dataSet.includes(defaultAwakening))
      options.unshift(generateItem(defaultAwakening))
    return options
  }

  function generateItem(awakening: Awakening) {
    return (
      <SelectItem key={awakening.slug} value={awakening.slug}>
        {awakening.name[locale]}
      </SelectItem>
    )
  }

  // Methods: User input detection
  function handleSelectChange(value: string) {
    // Here, value is the awakening slug.
    const input = inputRef.current
    if (input && !handleInputError(parseFloat(input.value))) return

    const selectedAwakening = dataSet.find((a) => a.slug === value)
    setCurrentAwakening(selectedAwakening)
    sendValues(value, currentLevel)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (input && !handleInputError(parseFloat(input.value))) return

    const newLevel = parseInt(event.target.value)
    setCurrentLevel(newLevel)
    sendValues(
      currentAwakening ? currentAwakening.slug : defaultAwakening.slug,
      newLevel
    )
  }

  // Methods: Handle error
  function handleInputError(value: number) {
    let error = ''

    if (currentAwakening) {
      if (value && value % 1 !== 0) {
        error = t(`awakening.errors.value_not_whole`)
      } else if (value < 1) {
        error = t(`awakening.errors.value_too_low`, { minValue: 1 })
      } else if (value > maxLevel) {
        error = t(`awakening.errors.value_too_high`, { maxValue: maxLevel })
      } else if (!value || value <= 0) {
        error = t(`awakening.errors.value_empty`)
      } else {
        error = ''
      }
    }

    setError(error)

    if (error.length > 0) {
      sendValidity(false)
      return false
    } else {
      sendValidity(true)
      return true
    }
  }

  const rangeString = () => {
    let placeholder = ''
    if (currentAwakening) {
      placeholder = `1~${maxLevel}`
    }
    return placeholder
  }

  return (
    <div>
      <div className={styles.set}>
        <Select
          key="awakening-type"
          // Use the slug as the value
          value={`${awakening ? awakening.slug : defaultAwakening.slug}`}
          open={open}
          disabled={selectDisabled}
          onValueChange={handleSelectChange}
          onOpenChange={changeOpen}
          onClose={onClose}
          trigger={{
            bound: true,
            className: 'grow',
          }}
          overlayVisible={false}
        >
          {generateOptions()}
        </Select>

        <Input
          value={level ? level : 1}
          className={inputClasses}
          fieldsetClassName={classNames({
            hidden:
              currentAwakening === undefined ||
              currentAwakening.slug === defaultAwakening.slug,
          })}
          wrapperClassName="fullHeight"
          bound={true}
          type="number"
          placeholder={rangeString()}
          min={1}
          max={maxLevel}
          step="1"
          onChange={handleInputChange}
          ref={inputRef}
        />
      </div>
      <p className={errorClasses}>{error}</p>
    </div>
  )
}

AwakeningSelectWithInput.defaultProps = defaultProps

export default AwakeningSelectWithInput
