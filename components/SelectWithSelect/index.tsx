// Core dependencies
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

// UI Dependencies
import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

// Styles and icons
import './index.scss'

// Types
interface Props {
  name: string
  object: 'ring'
  dataSet: ItemSkill[]
  leftSelectValue: number
  leftSelectDisabled: boolean
  rightSelectValue: number
  sendValues: (left: number, right: number) => void
}

const defaultProps = {
  selectDisabled: false,
}

const SelectWithInput = ({
  name,
  object,
  dataSet,
  leftSelectDisabled,
  leftSelectValue,
  rightSelectValue,
  sendValues,
}: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // UI state
  const [leftSelectOpen, setLeftSelectOpen] = useState(false)
  const [rightSelectOpen, setRightSelectOpen] = useState(false)

  // Field properties
  // prettier-ignore
  const [currentItemSkill, setCurrentItemSkill] = useState<ItemSkill | undefined>(undefined)
  const [currentItemValue, setCurrentItemValue] = useState(rightSelectValue)

  // Hooks

  // Set default values from props
  useEffect(() => {
    setCurrentItemSkill(dataSet.find((sk) => sk.id === leftSelectValue))
    setCurrentItemValue(rightSelectValue)
  }, [leftSelectValue, rightSelectValue])

  useEffect(() => {
    if (currentItemSkill) sendValues(currentItemSkill.id, currentItemValue)
  }, [currentItemSkill, currentItemValue])

  // Methods: UI state management
  function changeOpen(side: 'left' | 'right') {
    if (side === 'left' && !leftSelectDisabled) {
      setLeftSelectOpen(!leftSelectOpen)
    } else if (side === 'right') {
      setRightSelectOpen(!rightSelectOpen)
    }
  }

  function onClose() {
    setLeftSelectOpen(false)
    setRightSelectOpen(false)
  }

  // Methods: Rendering
  function generateLeftOptions() {
    let options: React.ReactNode[] = dataSet.map((skill, i) => {
      return (
        <SelectItem key={`${name}-key-${i}`} value={skill.id}>
          {skill.name[locale]}
        </SelectItem>
      )
    })

    return options
  }

  function generateRightOptions() {
    if (currentItemSkill && currentItemSkill.values) {
      let options = currentItemSkill.values.map((value, i) => {
        return (
          <SelectItem key={`${name}-values-${i + 1}`} value={value}>
            {value}
            {currentItemSkill.suffix ? currentItemSkill.suffix : ''}
          </SelectItem>
        )
      })

      options.unshift(
        <SelectItem key={`${name}-values-0`} value="no-value">
          {t('no_value')}
        </SelectItem>
      )

      return options
    }
  }

  // Methods: User input detection
  function handleLeftSelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    const skill = dataSet.find((sk) => sk.id === value)
    setCurrentItemSkill(skill)
    setCurrentItemValue(0)
  }

  function handleRightSelectChange(rawValue: string) {
    const value = parseFloat(rawValue)
    setCurrentItemValue(value)
  }

  return (
    <div className="SelectSet">
      <Select
        key={`${name}_type`}
        value={`${currentItemSkill ? currentItemSkill.id : 0}`}
        open={leftSelectOpen}
        disabled={leftSelectDisabled}
        onValueChange={handleLeftSelectChange}
        onOpenChange={() => changeOpen('left')}
        onClose={onClose}
        triggerClass="Left modal"
      >
        {generateLeftOptions()}
      </Select>

      <Select
        key={`${name}_value`}
        value={`${currentItemValue > 0 ? currentItemValue : 'no-value'}`}
        open={rightSelectOpen}
        onValueChange={handleRightSelectChange}
        onOpenChange={() => changeOpen('right')}
        onClose={onClose}
        triggerClass={classNames({
          Right: true,
          modal: true,
          hidden: currentItemSkill?.id === 0,
        })}
      >
        {generateRightOptions()}
      </Select>
    </div>
  )
}

SelectWithInput.defaultProps = defaultProps

export default SelectWithInput
