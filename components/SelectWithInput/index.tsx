// Core dependencies
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

// UI Dependencies
import Input from '~components/Input'
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

// Styles and icons
import './index.scss'

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
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

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
    Bound: true,
    Hidden: currentItemSkill?.id === 0,
  })

  const errorClasses = classNames({
    errors: true,
    visible: error !== '',
  })

  // Hooks

  // Set default values from props
  useEffect(() => {
    setCurrentItemSkill(dataSet.find((sk) => sk.id === selectValue))
    setFieldInputValue(inputValue)
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

    if (object === 'weapon_awakening') {
      options?.unshift(
        <SelectItem key={-1} value={-1}>
          {t(`${object}.no_type`)}
        </SelectItem>
      )
    }

    return options
  }

  // Methods: User input detection
  function handleSelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    const skill = dataSet.find((sk) => sk.id === value)
    setCurrentItemSkill(skill)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(event.target.value)
    if (handleInputError(value)) setFieldInputValue(value)
  }

  // Methods: Handle error
  function handleInputError(value: number) {
    let error = ''

    if (currentItemSkill) {
      if (value < currentItemSkill.minValue) {
        error = t(`${object}.errors.value_too_low`, {
          minValue: currentItemSkill.minValue,
        })
      } else if (value > currentItemSkill.maxValue) {
        error = t(`${object}.errors.value_too_high`, {
          maxValue: currentItemSkill.maxValue,
        })
      } else if (!currentItemSkill.fractional && value % 1 != 0) {
        error = t(`${object}.errors.value_not_whole`)
      } else if (!value || value <= 0) {
        error = t(`${object}.errors.value_empty`)
      } else {
        error = ''
      }
    }

    setError(error)

    return error.length === 0
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
    <div className="SelectWithItem">
      <div className="InputSet">
        <Select
          key={`${currentItemSkill?.name.en}_type`}
          value={`${currentItemSkill ? currentItemSkill.id : 0}`}
          open={open}
          disabled={selectDisabled}
          onValueChange={handleSelectChange}
          onOpenChange={() => changeOpen()}
          onClose={onClose}
          triggerClass="modal"
        >
          {generateOptions()}
        </Select>

        <Input
          value={fieldInputValue}
          className={inputClasses}
          type="number"
          placeholder={rangeString()}
          min={currentItemSkill?.minValue}
          max={currentItemSkill?.maxValue}
          step="1"
          onChange={handleInputChange}
          visible={currentItemSkill ? 'true' : 'false'}
          ref={input}
        />
      </div>
      <p className={errorClasses}>{error}</p>
    </div>
  )
}

SelectWithInput.defaultProps = defaultProps

export default SelectWithInput
