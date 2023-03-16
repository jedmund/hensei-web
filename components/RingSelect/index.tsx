// Core dependencies
import React, { useEffect, useState } from 'react'

// UI dependencies
import ExtendedMasterySelect from '~components/ExtendedMasterySelect'

// Data
import { overMastery } from '~data/overMastery'

// Styles and icons
import './index.scss'

// Types
import { CharacterOverMastery, ExtendedMastery } from '~types'

const emptyRing: ExtendedMastery = {
  modifier: 0,
  strength: 0,
}

interface Props {
  gridCharacter: GridCharacter
  sendValues: (overMastery: CharacterOverMastery) => void
}

const RingSelect = ({ gridCharacter, sendValues }: Props) => {
  // Ring value states
  const [rings, setRings] = useState<CharacterOverMastery>({
    1: { ...emptyRing, modifier: 1 },
    2: { ...emptyRing, modifier: 2 },
    3: emptyRing,
    4: emptyRing,
  })

  useEffect(() => {
    if (gridCharacter.over_mastery) {
      setRings({
        1: gridCharacter.over_mastery[0],
        2: gridCharacter.over_mastery[1],
        3: gridCharacter.over_mastery[2],
        4: gridCharacter.over_mastery[3],
      })
    }
  }, [gridCharacter])

  useEffect(() => {
    sendValues(rings)
  }, [rings])

  function dataSet(index: number) {
    const noValue = {
      name: {
        en: 'No over mastery bonus',
        ja: 'EXリミットボーナスなし',
      },
      id: 0,
      granblue_id: '',
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

  function receiveRingValues(index: number, left: number, right: number) {
    console.log(`Receiving values from ${index}: ${left} ${right}`)
    if (index == 1 || index == 2) {
      setSyncedRingValues(index, right)
    } else if (index == 3 && left == 0) {
      setRings({
        ...rings,
        3: {
          modifier: 0,
          strength: 0,
        },
        4: {
          modifier: 0,
          strength: 0,
        },
      })
    } else {
      setRings({
        ...rings,
        [index]: {
          modifier: left,
          strength: right,
        },
      })
    }
  }

  function setSyncedRingValues(index: 1 | 2, value: number) {
    console.log(`Setting synced value for ${index} with value ${value}`)
    const atkValues = (dataSet(1)[0] as ItemSkill).values ?? []
    const hpValues = (dataSet(2)[0] as ItemSkill).values ?? []

    let found = index === 1 ? atkValues.indexOf(value) : hpValues.indexOf(value)

    setRings({
      ...rings,
      1: {
        modifier: 1,
        strength: atkValues[found],
      },
      2: {
        modifier: 2,
        strength: hpValues[found],
      },
    })
  }

  return (
    <div className="Rings">
      {[...Array(4)].map((e, i) => {
        const ringIndex = i + 1
        const ringStat = rings[ringIndex]
        return (
          <ExtendedMasterySelect
            name={`ring-${ringIndex}`}
            object="ring"
            key={`ring-${ringIndex}`}
            dataSet={dataSet(ringIndex)}
            leftSelectDisabled={i === 0 || i === 1}
            leftSelectValue={ringStat.modifier ? ringStat.modifier : 0}
            rightSelectValue={ringStat.strength ? ringStat.strength : 0}
            sendValues={(left: number, right: number) => {
              receiveRingValues(ringIndex, left, right)
            }}
          />
        )
      })}
    </div>
  )
}

export default RingSelect
