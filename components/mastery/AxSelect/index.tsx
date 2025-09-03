'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useTranslations } from 'next-intl'

import Input from '~components/common/Input'
import Select from '~components/common/Select'
import SelectItem from '~components/common/SelectItem'

import classNames from 'classnames'

import ax from '~data/ax'

import styles from './index.module.scss'

interface ErrorMap {
  [index: string]: string
  axValue1: string
  axValue2: string
}

interface Props {
  axType: number
  currentSkills?: SimpleAxSkill[]
  onOpenChange: (index: 1 | 2, open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (
    primaryAxModifier: number,
    primaryAxValue: number,
    secondaryAxModifier: number,
    secondaryAxValue: number
  ) => void
}

const AXSelect = (props: Props) => {
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'
  const t = useTranslations('common')

  const [openAX1, setOpenAX1] = useState(false)
  const [openAX2, setOpenAX2] = useState(false)

  // Set up form states and error handling
  const [errors, setErrors] = useState<ErrorMap>({
    axValue1: '',
    axValue2: '',
  })

  const inputClasses = classNames({
    fullHeight: true,
    range: true,
  })

  const primaryErrorClasses = classNames({
    [styles.errors]: true,
    [styles.visible]: errors.axValue1.length > 0,
  })

  const secondaryErrorClasses = classNames({
    [styles.errors]: true,
    [styles.visible]: errors.axValue2.length > 0,
  })

  // Refs
  const primaryAxModifierSelect = React.createRef<HTMLButtonElement>()
  const primaryAxValueInput = React.createRef<HTMLInputElement>()
  const secondaryAxModifierSelect = React.createRef<HTMLButtonElement>()
  const secondaryAxValueInput = React.createRef<HTMLInputElement>()

  // States
  const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
  const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
  const [primaryAxValue, setPrimaryAxValue] = useState(
    props.currentSkills ? props.currentSkills[0].strength : 0.0
  )
  const [secondaryAxValue, setSecondaryAxValue] = useState(
    props.currentSkills ? props.currentSkills[1].strength : 0.0
  )

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
    if (
      props.currentSkills &&
      props.currentSkills[0].modifier != null &&
      props.currentSkills[0].modifier >= 0
    ) {
      setPrimaryAxModifier(props.currentSkills[0].modifier)
      setPrimaryAxValue(props.currentSkills[0].strength)
    } else setPrimaryAxModifier(-1)
  }, [props.currentSkills, setPrimaryAxModifier])

  useEffect(() => {
    if (props.currentSkills && props.currentSkills[1].modifier) {
      setSecondaryAxModifier(props.currentSkills[1].modifier)
      setSecondaryAxValue(props.currentSkills[1].strength)
    } else {
      setSecondaryAxModifier(-1)
    }
  }, [props.currentSkills, setSecondaryAxModifier])

  useEffect(() => {
    let noErrors = false

    if (errors.axValue1 === '' && errors.axValue2 === '') {
      if (primaryAxModifier === -1 && secondaryAxModifier === -1)
        noErrors = true
      else if (
        primaryAxModifier >= 0 &&
        primaryAxValue > 0 &&
        secondaryAxModifier === -1
      )
        noErrors = true
      else if (
        primaryAxModifier >= 0 &&
        primaryAxValue > 0 &&
        secondaryAxModifier >= 0 &&
        secondaryAxValue > 0
      )
        noErrors = true
    }

    props.sendValidity(noErrors)
  }, [
    primaryAxModifier,
    primaryAxValue,
    secondaryAxModifier,
    secondaryAxValue,
    errors,
  ])

  // Classes
  const secondarySetClasses = classNames({
    [styles.set]: true,
    [styles.hidden]:
      primaryAxModifier < 0 ||
      primaryAxModifier === 18 ||
      primaryAxModifier === 19,
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
        const axSkill = ax[props.axType - 1][modifier]
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
      const primaryAxSkill = ax[props.axType - 1][firstSkill.modifier]
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
    axSkill: ItemSkill | undefined,
    skillAtIndex: SimpleAxSkill
  ) {
    if (axSkill)
      return axSkill.secondary
        ? axSkill.secondary.find((skill) => skill.id === skillAtIndex.modifier)
        : undefined
  }

  function openSelect(index: 1 | 2) {
    if (index === 1) {
      setOpenAX1(!openAX1)
      setOpenAX2(false)
      props.onOpenChange(1, !openAX1)
      props.onOpenChange(2, false)
    } else if (index === 2) {
      setOpenAX2(!openAX2)
      setOpenAX1(false)
      props.onOpenChange(2, !openAX2)
      props.onOpenChange(1, false)
    }
  }

  function onClose(index: 1 | 2) {
    props.onOpenChange(index, false)
  }

  function generateOptions(modifierSet: number) {
    const axOptions = ax[props.axType - 1]

    let axOptionElements: React.ReactNode[] = []
    if (modifierSet == 0) {
      axOptionElements = axOptions.map((ax, i) => {
        return (
          <SelectItem key={i} value={ax.id} data-granblue-id={ax.granblue_id}>
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
      setupInput(
        ax[props.axType - 1].find((ax) => ax.id === value),
        primaryAxValueInput.current
      )

      setPrimaryAxValue(0)

      // Reset the secondary AX modifier, reset the AX value and hide the input
      setSecondaryAxModifier(-1)
      setSecondaryAxValue(0)
      // secondaryAxValueInput.current.className = 'Input Contained'
      secondaryAxValueInput.current.value = ''
    }
  }

  function handleAX2SelectChange(rawValue: string) {
    const value = parseInt(rawValue)
    setSecondaryAxModifier(value)

    const primaryAxSkill = ax[props.axType - 1][primaryAxModifier]
    const currentAxSkill = primaryAxSkill.secondary
      ? primaryAxSkill.secondary.find((skill) => skill.id == value)
      : undefined

    if (secondaryAxValueInput.current) {
      setupInput(currentAxSkill, secondaryAxValueInput.current)
      setSecondaryAxValue(0)
      secondaryAxValueInput.current.value = ''
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(event.target.value)
    let newErrors = { ...errors }

    if (primaryAxValueInput.current === event.target) {
      if (handlePrimaryErrors(value)) setPrimaryAxValue(value)
    } else {
      if (handleSecondaryErrors(value)) setSecondaryAxValue(value)
    }
  }

  function handlePrimaryErrors(value: number) {
    const primaryAxSkill = ax[props.axType - 1].find(
      (ax) => ax.id === primaryAxModifier
    )
    let newErrors = { ...errors }

    if (primaryAxSkill && value < primaryAxSkill.minValue) {
      newErrors.axValue1 = t('ax.errors.value_too_low', {
        name: primaryAxSkill.name[locale],
        minValue: primaryAxSkill.minValue,
        suffix: primaryAxSkill.suffix ? primaryAxSkill.suffix : '',
      })
    } else if (primaryAxSkill && value > primaryAxSkill.maxValue) {
      newErrors.axValue1 = t('ax.errors.value_too_high', {
        name: primaryAxSkill.name[locale],
        maxValue: primaryAxSkill.maxValue,
        suffix: primaryAxSkill.suffix ? primaryAxSkill.suffix : '',
      })
    } else if (!value || value <= 0) {
      newErrors.axValue1 = t('ax.errors.value_empty', {
        name: primaryAxSkill?.name[locale],
      })
    } else {
      newErrors.axValue1 = ''
    }

    setErrors(newErrors)

    return newErrors.axValue1.length === 0
  }

  function handleSecondaryErrors(value: number) {
    const primaryAxSkill = ax[props.axType - 1][primaryAxModifier]
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

  function setupInput(ax: ItemSkill | undefined, element: HTMLInputElement) {
    console.log(ax)
    if (ax) {
      const rangeString = `${ax.minValue}~${ax.maxValue}${ax.suffix || ''}`

      // element.className = 'Input Bound Visible'
      element.disabled = false
      element.placeholder = rangeString
      element.min = `${ax.minValue}`
      element.max = `${ax.maxValue}`
      element.step = ax.suffix ? '0.5' : '1'
    } else {
      if (primaryAxValueInput.current && secondaryAxValueInput.current) {
        if (primaryAxValueInput.current == element) {
          // primaryAxValueInput.current.className = 'Input Contained'
          primaryAxValueInput.current.disabled = true
          primaryAxValueInput.current.placeholder = ''
        }

        // secondaryAxValueInput.current.className = 'Input Contained'
        secondaryAxValueInput.current.disabled = true
        secondaryAxValueInput.current.placeholder = ''
      }
    }
  }

  return (
    <div className={styles.ax}>
      <div className={styles.set}>
        <div className={styles.fields}>
          <Select
            key="ax1"
            value={`${primaryAxModifier}`}
            open={openAX1}
            trigger={{
              bound: true,
              className: 'grow',
            }}
            onClose={() => onClose(1)}
            onOpenChange={() => openSelect(1)}
            onValueChange={handleAX1SelectChange}
            overlayVisible={false}
          >
            {generateOptions(0)}
          </Select>

          <Input
            className={inputClasses}
            wrapperClassName="fullHeight"
            fieldsetClassName={classNames({
              hidden: primaryAxModifier < 0,
            })}
            bound={true}
            value={primaryAxValue}
            type="number"
            onChange={handleInputChange}
            ref={primaryAxValueInput}
          />
        </div>
        <p className={primaryErrorClasses}>{errors.axValue1}</p>
      </div>

      <div className={secondarySetClasses}>
        <div className={styles.fields}>
          <Select
            key="ax2"
            value={`${secondaryAxModifier}`}
            open={openAX2}
            trigger={{
              bound: true,
              className: 'grow',
            }}
            onClose={() => onClose(2)}
            onOpenChange={() => openSelect(2)}
            onValueChange={handleAX2SelectChange}
            ref={secondaryAxModifierSelect}
            overlayVisible={false}
          >
            {generateOptions(1)}
          </Select>
          <Input
            className={inputClasses}
            wrapperClassName="fullHeight"
            fieldsetClassName={classNames({
              hidden: secondaryAxModifier < 0,
            })}
            bound={true}
            value={secondaryAxValue}
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
