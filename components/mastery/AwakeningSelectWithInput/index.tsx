// Core dependencies
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
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
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

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

    if (awakening) sendValidity(true)
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
    const sortedDataSet = [...dataSet].sort((a, b) => {
      return a.order - b.order
    })

    let options: React.ReactNode[] = sortedDataSet.map((awakening, i) => {
      return generateItem(awakening)
    })

    if (!dataSet.includes(defaultAwakening))
      options.unshift(generateItem(defaultAwakening))

    return options
  }

  function generateItem(awakening: Awakening) {
    return (
      <SelectItem key={awakening.slug} value={awakening.id}>
        {awakening.name[locale]}
      </SelectItem>
    )
  }

  // Methods: User input detection
  function handleSelectChange(id: string) {
    const input = inputRef.current
    if (input && !handleInputError(parseFloat(input.value))) return

    setCurrentAwakening(dataSet.find((awakening) => awakening.id === id))
    sendValues(id, currentLevel)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (input && !handleInputError(parseFloat(input.value))) return

    setCurrentLevel(parseInt(event.target.value))
    sendValues(
      currentAwakening ? currentAwakening.id : '0',
      parseInt(event.target.value)
    )
  }

  // Methods: Handle error

  function handleInputError(value: number) {
    let error = ''

    if (currentAwakening) {
      if (value && value % 1 != 0) {
        error = t(`awakening.errors.value_not_whole`)
      } else if (value < 1) {
        error = t(`awakening.errors.value_too_low`, {
          minValue: 1,
        })
      } else if (value > maxLevel) {
        error = t(`awakening.errors.value_too_high`, {
          maxValue: maxLevel,
        })
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

    if (awakening) {
      const minValue = 1
      const maxValue = maxLevel
      placeholder = `${minValue}~${maxValue}`
    }

    return placeholder
  }

  return (
    <div>
      <div className={styles.set}>
        <Select
          key="awakening-type"
          value={`${awakening ? awakening.id : defaultAwakening.id}`}
          open={open}
          disabled={selectDisabled}
          onValueChange={handleSelectChange}
          onOpenChange={changeOpen}
          onClose={onClose}
          trigger={{
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
              currentAwakening === undefined || currentAwakening.id === '0',
          })}
          wrapperClassName="fullHeight"
          type="number"
          placeholder={rangeString()}
          min={1}
          max={maxLevel}
          step="1"
          onChange={handleInputChange}
          visible={awakening ? 'true' : 'false'}
          ref={inputRef}
        />
      </div>
      <p className={errorClasses}>{error}</p>
    </div>
  )
}

AwakeningSelectWithInput.defaultProps = defaultProps

export default AwakeningSelectWithInput
