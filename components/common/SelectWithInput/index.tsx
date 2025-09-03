'use client'
// Core dependencies
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
  object: 'ax' | 'weapon_awakening' | 'character_awakening' | 'ring' | 'earring'
  dataSet: ItemSkill[]
  selectValue: number
  selectDisabled: boolean
  inputValue: number
  awakeningLevel?: number
  onOpenChange?: (open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (type: number, level: number) => void
}

const defaultProps = {
  selectDisabled: false,
}

const SelectWithInput = ({
  object,
  dataSet,
  selectDisabled,
  selectValue,
  inputValue,
  onOpenChange,
  sendValidity,
  sendValues,
}: Props) => {
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'
  const t = useTranslations('common')

  // UI state
  const [open, setOpen] = useState(false)

  // Field properties
  // prettier-ignore
  const [currentItemSkill, setCurrentItemSkill] = useState<ItemSkill | undefined>(undefined)
  const [fieldInputValue, setFieldInputValue] = useState(inputValue)

  const [error, setError] = useState('')

  // Refs
  const input = React.createRef<HTMLInputElement>()

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

  // Set default values from props
  useEffect(() => {
    const found = dataSet.find((sk) => sk.id === selectValue)
    if (found) {
      setCurrentItemSkill(found)
      setFieldInputValue(inputValue)
    }
  }, [selectValue, inputValue])

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
    let options: React.ReactNode[] = dataSet.map((skill, i) => {
      return (
        <SelectItem key={i} value={skill.id}>
          {skill.name[locale]}
        </SelectItem>
      )
    })

    return options
  }

  // Methods: User input detection
  function handleSelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    const skill = dataSet.find((sk) => sk.id === value)

    if (skill) {
      setCurrentItemSkill(skill)
      sendValues(skill.id, fieldInputValue)
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(event.target.value)
    if (handleInputError(value)) setFieldInputValue(value)

    if (currentItemSkill) sendValues(currentItemSkill.id, value)
  }

  // Methods: Handle error
  function handleInputError(value: number) {
    let error = ''

    if (currentItemSkill) {
      if (!currentItemSkill.fractional && value && value % 1 != 0) {
        error = t(`${object}.errors.value_not_whole`, {
          name: currentItemSkill.name[locale],
        })
      } else if (value < currentItemSkill.minValue) {
        error = t(`${object}.errors.value_too_low`, {
          name: currentItemSkill.name[locale],
          minValue: currentItemSkill.minValue,
        })
      } else if (value > currentItemSkill.maxValue) {
        error = t(`${object}.errors.value_too_high`, {
          name: currentItemSkill.name[locale],
          maxValue: currentItemSkill.maxValue,
        })
      } else if (!value || value <= 0) {
        error = t(`${object}.errors.value_empty`, {
          name: currentItemSkill.name[locale],
        })
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

    if (currentItemSkill) {
      const minValue = currentItemSkill.minValue
      const maxValue = currentItemSkill.maxValue
      placeholder = `${minValue}~${maxValue}`
    }

    return placeholder
  }

  return (
    <div>
      <div className={styles.set}>
        <Select
          key={`${currentItemSkill?.name.en}_type`}
          value={`${currentItemSkill ? currentItemSkill.id : 0}`}
          open={open}
          trigger={{
            bound: true,
            className: 'grow',
          }}
          disabled={selectDisabled}
          onValueChange={handleSelectChange}
          onOpenChange={changeOpen}
          onClose={onClose}
          overlayVisible={false}
        >
          {generateOptions()}
        </Select>

        <Input
          value={fieldInputValue}
          className={inputClasses}
          fieldsetClassName={classNames({
            hidden: currentItemSkill?.id === 0,
          })}
          wrapperClassName="fullHeight"
          type="number"
          bound={true}
          placeholder={rangeString()}
          min={currentItemSkill?.minValue}
          max={currentItemSkill?.maxValue}
          step="1"
          onChange={handleInputChange}
          ref={input}
        />
      </div>
      <p className={errorClasses}>{error}</p>
    </div>
  )
}

SelectWithInput.defaultProps = defaultProps

export default SelectWithInput
