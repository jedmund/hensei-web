// Core dependencies
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

// UI dependencies
import SelectWithSelect from '~components/SelectWithSelect'

// Data
import { overMastery } from '~data/overMastery'

// Styles and icons
import './index.scss'

// Types
import { CharacterOverMastery } from '~types'

type SelectOpenStates = {
  [key: string]: boolean
  modifier1: boolean
  modifier2: boolean
  modifier3: boolean
  modifier4: boolean
  strength1: boolean
  strength2: boolean
  strength3: boolean
  strength4: boolean
}

interface Ring {
  open: boolean
  modifier: number
  strength: number
  error: string
}

interface RingMap {
  [index: number]: Ring
  1: Ring
  2: Ring
  3: Ring
  4: Ring
}

const emptyRing: Ring = {
  open: false,
  modifier: 0,
  strength: 0,
  error: '',
}

interface Props {
  gridCharacter: GridCharacter
  onOpenChange: (index: 1 | 2 | 3 | 4, open: boolean) => void
  sendValidity: (isValid: boolean) => void
  sendValues: (overMastery: CharacterOverMastery) => void
}

const RingSelect = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'
  const { t } = useTranslation('common')

  // Ring value states
  const [ringModifier1, setRingModifier1] = useState(0)
  const [ringModifier2, setRingModifier2] = useState(0)
  const [ringModifier3, setRingModifier3] = useState(0)
  const [ringModifier4, setRingModifier4] = useState(0)

  const [ringStrength1, setRingStrength1] = useState(0)
  const [ringStrength2, setRingStrength2] = useState(0)
  const [ringStrength3, setRingStrength3] = useState(0)
  const [ringStrength4, setRingStrength4] = useState(0)

  // UI states
  const [openStates, setOpenStates] = useState<SelectOpenStates>({
    modifier1: false,
    modifier2: false,
    modifier3: false,
    modifier4: false,
    strength1: false,
    strength2: false,
    strength3: false,
    strength4: false,
  })

  // Rings
  let rings: RingMap = {
    1: { ...emptyRing, modifier: 1 },
    2: { ...emptyRing, modifier: 2 },
    3: emptyRing,
    4: emptyRing,
  }

  function setOpen(
    index: number,
    side: 'modifier' | 'strength',
    value: boolean
  ) {
    const key = `${side}${index}`
    setOpenStates({
      ...openStates,
      [key]: value,
    })
  }

  const errorClasses = {
    1: classNames({
      errors: true,
      visible: rings[1].error.length > 0,
    }),
    2: classNames({
      errors: true,
      visible: rings[2].error.length > 0,
    }),
    3: classNames({
      errors: true,
      visible: rings[3].error.length > 0,
    }),
    4: classNames({
      errors: true,
      visible: rings[4].error.length > 0,
    }),
  }

  function dataSet(index: number) {
    const noValue = {
      name: {
        en: 'No over mastery bonus',
        ja: 'EXリミットボーナスなし',
      },
      id: 0,
      slug: 'no-bonus',
      minValue: 0,
      maxValue: 0,
      suffix: '',
      fractional: false,
      secondary: [],
    }

    switch (index) {
      case 1:
        return overMastery.a ? [overMastery.a[0]] : []
      case 2:
        return overMastery.a ? [overMastery.a[1]] : []
      case 3:
        return overMastery.b ? [noValue, ...overMastery.b] : []
      case 4:
        return overMastery.c ? [noValue, ...overMastery.c] : []
      default:
        return []
    }
  }

  // useEffect(() => {
  //   props.sendValues(
  //     primaryAxModifier,
  //     primaryAxValue,
  //     secondaryAxModifier,
  //     secondaryAxValue
  //   )
  // }, [
  //   props,
  //   primaryAxModifier,
  //   primaryAxValue,
  //   secondaryAxModifier,
  //   secondaryAxValue,
  // ])

  // useEffect(() => {
  //   if (
  //     props.currentSkills &&
  //     props.currentSkills[0].modifier != null &&
  //     props.currentSkills[0].modifier >= 0
  //   ) {
  //     setPrimaryAxModifier(props.currentSkills[0].modifier)
  //     setPrimaryAxValue(props.currentSkills[0].strength)
  //   } else setPrimaryAxModifier(-1)
  // }, [props.currentSkills, setPrimaryAxModifier])

  // useEffect(() => {
  //   if (props.currentSkills && props.currentSkills[1].modifier) {
  //     setSecondaryAxModifier(props.currentSkills[1].modifier)
  //     setSecondaryAxValue(props.currentSkills[1].strength)
  //   } else {
  //     setSecondaryAxModifier(-1)
  //   }
  // }, [props.currentSkills, setSecondaryAxModifier])

  // useEffect(() => {
  //   let noErrors = false

  //   // if (errors.axValue1 === '' && errors.axValue2 === '') {

  //   //     noErrors = true
  //   // }

  //   props.sendValidity(noErrors)
  // }, [errors])

  function openChange(index: 1 | 2 | 3 | 4, side: 'modifier' | 'strength') {
    switch (index) {
      case 1:
        props.onOpenChange(1, !ring1Open)
        setRing1Open(!ring1Open)
        break
      case 2:
        props.onOpenChange(2, !ring2Open)
        setRing2Open(!ring2Open)
        break
      case 3:
        props.onOpenChange(3, !ring3Open)
        setRing3Open(!ring3Open)
        break
      case 4:
        props.onOpenChange(4, !ring4Open)
        setRing4Open(!ring4Open)
        break
    }
  }

  function onClose(index: 1 | 2 | 3 | 4) {
    props.onOpenChange(index, false)
  }

  // function generateOptions(modifierSet: number) {
  //   const axOptions = ax[props.axType - 1]

  //   let axOptionElements: React.ReactNode[] = []
  //   if (modifierSet == 0) {
  //     axOptionElements = axOptions.map((ax, i) => {
  //       return (
  //         <SelectItem key={i} value={ax.id}>
  //           {ax.name[locale]}
  //         </SelectItem>
  //       )
  //     })
  //   } else {
  //     // If we are loading data from the server, state doesn't set before render,
  //     // so our defaultValue is undefined.
  //     let modifier = -1
  //     if (primaryAxModifier >= 0) modifier = primaryAxModifier
  //     else if (props.currentSkills) modifier = props.currentSkills[0].modifier

  //     if (modifier >= 0 && axOptions[modifier]) {
  //       const primarySkill = axOptions[modifier]

  //       if (primarySkill.secondary) {
  //         const secondaryAxOptions = primarySkill.secondary
  //         axOptionElements = secondaryAxOptions.map((ax, i) => {
  //           return (
  //             <SelectItem key={i} value={ax.id}>
  //               {ax.name[locale]}
  //             </SelectItem>
  //           )
  //         })
  //       }
  //     }
  //   }

  //   axOptionElements?.unshift(
  //     <SelectItem key={-1} value={-1}>
  //       {t('ax.no_skill')}
  //     </SelectItem>
  //   )
  //   return axOptionElements
  // }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {}

  function handleErrors(number: number) {}

  function receiveRingValues(left: number, right: number) {}

  return (
    <div className="Rings">
      {[...Array(4)].map((element, i) => {
        const ringIndex = i + 1

        return (
          <SelectWithSelect
            name={`ring${ringIndex}`}
            object="ring"
            key={`ring-${ringIndex}`}
            dataSet={dataSet(ringIndex)}
            leftSelectDisabled={i === 0 || i === 1}
            leftSelectValue={rings[ringIndex].modifier}
            rightSelectValue={rings[ringIndex].strength}
            onOpenChange={(index: 'left' | 'right', open: boolean) => {}}
            sendValues={(value: number) => {
              console.log(`VALUE ${value} RECEIVED`)
            }}
          />
        )
      })}
    </div>
  )
}

export default RingSelect
