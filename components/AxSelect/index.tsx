import React, { ForwardedRef, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

import classNames from 'classnames'

import { axData } from '~utils/axData'

import './index.scss'

interface ErrorMap {
  [index: string]: string
  axValue1: string
  axValue2: string
}

interface Props {
  axType: number
  currentSkills?: SimpleAxSkill[]
  sendValidity: (isValid: boolean) => void
  sendValues: (
    primaryAxModifier: number,
    primaryAxValue: number,
    secondaryAxModifier: number,
    secondaryAxValue: number
  ) => void
}

const AXSelect = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  const [openAX1, setOpenAX1] = useState(false)
  const [openAX2, setOpenAX2] = useState(false)

  // Set up form states and error handling
  const [errors, setErrors] = useState<ErrorMap>({
    axValue1: '',
    axValue2: '',
  })

  const primaryErrorClasses = classNames({
    errors: true,
    visible: errors.axValue1.length > 0,
  })

  const secondaryErrorClasses = classNames({
    errors: true,
    visible: errors.axValue2.length > 0,
  })

  // Refs
  const primaryAxModifierSelect = React.createRef<HTMLButtonElement>()
  const primaryAxValueInput = React.createRef<HTMLInputElement>()
  const secondaryAxModifierSelect = React.createRef<HTMLButtonElement>()
  const secondaryAxValueInput = React.createRef<HTMLInputElement>()

  // States
  const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
  const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
  const [primaryAxValue, setPrimaryAxValue] = useState(0.0)
  const [secondaryAxValue, setSecondaryAxValue] = useState(0.0)

  useEffect(() => {
    setupAx1()
    setupAx2()
  }, [props.currentSkills])

  useEffect(() => {
    props.sendValues(
      primaryAxModifier,
      primaryAxValue,
      secondaryAxModifier,
      secondaryAxValue
    )
  }, [
    props,
    primaryAxModifier,
    primaryAxValue,
    secondaryAxModifier,
    secondaryAxValue,
  ])

  useEffect(() => {
    props.sendValidity(
      primaryAxValue > 0 && errors.axValue1 === '' && errors.axValue2 === ''
    )
  }, [props, primaryAxValue, errors])

  // Classes
  const secondarySetClasses = classNames({
    AXSet: true,
    hidden: primaryAxModifier < 0,
  })

  function setupAx1() {
    if (
      props.currentSkills &&
      props.currentSkills[0] &&
      // Should this be > -1 or != null
      props.currentSkills[0].modifier != null
    ) {
      setPrimaryAxModifier(props.currentSkills[0].modifier)
      setPrimaryAxValue(props.currentSkills[0].strength)

      if (props.currentSkills[0].modifier > -1 && primaryAxValueInput.current) {
        const modifier = props.currentSkills[0].modifier
        const axSkill = axData[props.axType - 1][modifier]
        setupInput(axSkill, primaryAxValueInput.current)
      }
    }
  }

  function setupAx2() {
    if (
      props.currentSkills &&
      props.currentSkills[1] &&
      // Should this be > -1 or != null
      props.currentSkills[1].modifier != null
    ) {
      const firstSkill = props.currentSkills[0]
      const primaryAxSkill = axData[props.axType - 1][firstSkill.modifier]
      const secondaryAxSkill = findSecondaryAxSkill(
        primaryAxSkill,
        props.currentSkills[1]
      )

      if (
        props.currentSkills[1].modifier > -1 &&
        secondaryAxValueInput.current
      ) {
        setupInput(secondaryAxSkill, secondaryAxValueInput.current)
      }
    }
  }

  function findSecondaryAxSkill(
    axSkill: AxSkill | undefined,
    skillAtIndex: SimpleAxSkill
  ) {
    if (axSkill)
      return axSkill.secondary
        ? axSkill.secondary.find((skill) => skill.id === skillAtIndex.modifier)
        : undefined
  }

  function openSelect(ref: ForwardedRef<HTMLButtonElement>) {
    if (ref === primaryAxModifierSelect) setOpenAX1(!openAX1)
    if (ref === secondaryAxModifierSelect) setOpenAX2(!openAX2)
  }

  function generateOptions(modifierSet: number) {
    const axOptions = axData[props.axType - 1]

    let axOptionElements: React.ReactNode[] = []
    if (modifierSet == 0) {
      axOptionElements = axOptions.map((ax, i) => {
        return (
          <SelectItem key={i} value={ax.id}>
            {ax.name[locale]}
          </SelectItem>
        )
      })
    } else {
      // If we are loading data from the server, state doesn't set before render,
      // so our defaultValue is undefined.
      let modifier = -1
      if (primaryAxModifier >= 0) modifier = primaryAxModifier
      else if (props.currentSkills) modifier = props.currentSkills[0].modifier

      if (modifier >= 0 && axOptions[modifier]) {
        const primarySkill = axOptions[modifier]

        if (primarySkill.secondary) {
          const secondaryAxOptions = primarySkill.secondary
          axOptionElements = secondaryAxOptions.map((ax, i) => {
            return (
              <SelectItem key={i} value={ax.id}>
                {ax.name[locale]}
              </SelectItem>
            )
          })
        }
      }
    }

    axOptionElements?.unshift(
      <SelectItem key={-1} value={-1}>
        {t('ax.no_skill')}
      </SelectItem>
    )
    return axOptionElements
  }

  function handleAX1SelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    setPrimaryAxModifier(value)

    if (
      primaryAxValueInput.current &&
      secondaryAxModifierSelect.current &&
      secondaryAxValueInput.current
    ) {
      setupInput(axData[props.axType - 1][value], primaryAxValueInput.current)

      secondaryAxModifierSelect.current.value = '-1'
      secondaryAxValueInput.current.value = ''
    }
  }

  function handleAX2SelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    setSecondaryAxModifier(value)

    const primaryAxSkill = axData[props.axType - 1][primaryAxModifier]
    const currentAxSkill = primaryAxSkill.secondary
      ? primaryAxSkill.secondary.find((skill) => skill.id == value)
      : undefined

    if (secondaryAxValueInput.current)
      setupInput(currentAxSkill, secondaryAxValueInput.current)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(event.target.value)
    let newErrors = { ...errors }

    if (primaryAxValueInput.current == event.target) {
      if (handlePrimaryErrors(value)) setPrimaryAxValue(value)
    } else {
      if (handleSecondaryErrors(value)) setSecondaryAxValue(value)
    }
  }

  function handlePrimaryErrors(value: number) {
    const primaryAxSkill = axData[props.axType - 1][primaryAxModifier]
    let newErrors = { ...errors }

    if (value < primaryAxSkill.minValue) {
      newErrors.axValue1 = t('ax.errors.value_too_low', {
        name: primaryAxSkill.name[locale],
        minValue: primaryAxSkill.minValue,
        suffix: primaryAxSkill.suffix ? primaryAxSkill.suffix : '',
      })
    } else if (value > primaryAxSkill.maxValue) {
      newErrors.axValue1 = t('ax.errors.value_too_high', {
        name: primaryAxSkill.name[locale],
        maxValue: primaryAxSkill.maxValue,
        suffix: primaryAxSkill.suffix ? primaryAxSkill.suffix : '',
      })
    } else if (!value || value <= 0) {
      newErrors.axValue1 = t('ax.errors.value_empty', {
        name: primaryAxSkill.name[locale],
      })
    } else {
      newErrors.axValue1 = ''
    }

    setErrors(newErrors)

    return newErrors.axValue1.length === 0
  }

  function handleSecondaryErrors(value: number) {
    const primaryAxSkill = axData[props.axType - 1][primaryAxModifier]
    let newErrors = { ...errors }

    if (primaryAxSkill.secondary) {
      const secondaryAxSkill = primaryAxSkill.secondary.find(
        (skill) => skill.id == secondaryAxModifier
      )

      if (secondaryAxSkill) {
        if (value < secondaryAxSkill.minValue) {
          newErrors.axValue2 = t('ax.errors.value_too_low', {
            name: secondaryAxSkill.name[locale],
            minValue: secondaryAxSkill.minValue,
            suffix: secondaryAxSkill.suffix ? secondaryAxSkill.suffix : '',
          })
        } else if (value > secondaryAxSkill.maxValue) {
          newErrors.axValue2 = t('ax.errors.value_too_high', {
            name: secondaryAxSkill.name[locale],
            maxValue: secondaryAxSkill.maxValue,
            suffix: secondaryAxSkill.suffix ? secondaryAxSkill.suffix : '',
          })
        } else if (!secondaryAxSkill.suffix && value % 1 !== 0) {
          newErrors.axValue2 = t('ax.errors.value_not_whole', {
            name: secondaryAxSkill.name[locale],
          })
        } else if (primaryAxValue <= 0) {
          newErrors.axValue1 = t('ax.errors.value_empty', {
            name: primaryAxSkill.name[locale],
          })
        } else {
          newErrors.axValue2 = ''
        }
      }
    }

    setErrors(newErrors)

    return newErrors.axValue2.length === 0
  }

  function setupInput(ax: AxSkill | undefined, element: HTMLInputElement) {
    if (ax) {
      const rangeString = `${ax.minValue}~${ax.maxValue}${ax.suffix || ''}`

      element.className = 'Input Bound Visible'
      element.disabled = false
      element.placeholder = rangeString
      element.min = `${ax.minValue}`
      element.max = `${ax.maxValue}`
      element.step = ax.suffix ? '0.5' : '1'
    } else {
      if (primaryAxValueInput.current && secondaryAxValueInput.current) {
        if (primaryAxValueInput.current == element) {
          primaryAxValueInput.current.className = 'Input Contained'
          primaryAxValueInput.current.disabled = true
          primaryAxValueInput.current.placeholder = ''
        }

        secondaryAxValueInput.current.className = 'Input Contained'
        secondaryAxValueInput.current.disabled = true
        secondaryAxValueInput.current.placeholder = ''
      }
    }
  }

  const ax1DefaultValue = () => {
    return props.currentSkills &&
      props.currentSkills[0].modifier != null &&
      props.currentSkills[0].modifier >= 0
      ? props.currentSkills[0].modifier
      : -1
  }

  const ax2DefaultValue = () => {
    return props.currentSkills && props.currentSkills[1].modifier
      ? props.currentSkills[1].modifier
      : -1
  }

  return (
    <div className="AXSelect">
      <div className="AXSet">
        <div className="fields">
          <Select
            key="ax1"
            defaultValue={`${ax1DefaultValue()}`}
            open={openAX1}
            onChange={handleAX1SelectChange}
            onClick={() => openSelect(primaryAxModifierSelect)}
            triggerClass="modal"
            ref={primaryAxModifierSelect}
          >
            {generateOptions(0)}
          </Select>

          <input
            defaultValue={
              props.currentSkills && props.currentSkills[0]
                ? props.currentSkills[0].strength
                : 0
            }
            type="number"
            onChange={handleInputChange}
            ref={primaryAxValueInput}
          />
        </div>
        <p className={primaryErrorClasses}>{errors.axValue1}</p>
      </div>

      <div className={secondarySetClasses}>
        <div className="fields">
          <Select
            key="ax2"
            defaultValue={`${ax2DefaultValue()}`}
            open={openAX2}
            onChange={handleAX2SelectChange}
            onClick={() => openSelect(secondaryAxModifierSelect)}
            triggerClass="modal"
            ref={secondaryAxModifierSelect}
          >
            {generateOptions(1)}
          </Select>
          <input
            defaultValue={
              props.currentSkills && props.currentSkills[1]
                ? props.currentSkills[1].strength
                : 0
            }
            type="number"
            onChange={handleInputChange}
            ref={secondaryAxValueInput}
          />
        </div>
        <p className={secondaryErrorClasses}>{errors.axValue2}</p>
      </div>
    </div>
  )
}

export default AXSelect
