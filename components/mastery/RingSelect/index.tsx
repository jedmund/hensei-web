// Core dependencies
import React, { useEffect, useState } from 'react'

// UI dependencies
import ExtendedMasterySelect from '~components/mastery/ExtendedMasterySelect'

// Data
import { overMastery } from '~data/overMastery'

// Styles and icons
import styles from './index.module.scss'

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
  const [rings, setRings] = useState<CharacterOverMastery>([
    { ...emptyRing, modifier: 1 },
    { ...emptyRing, modifier: 2 },
    emptyRing,
    emptyRing,
  ])

  useEffect(() => {
    if (gridCharacter.over_mastery) {
      setRings([
        gridCharacter.over_mastery[0],
        gridCharacter.over_mastery[1],
        gridCharacter.over_mastery[2],
        gridCharacter.over_mastery[3],
      ])
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
      case 0:
        return overMastery.a ? [overMastery.a[0]] : []
      case 1:
        return overMastery.a ? [overMastery.a[1]] : []
      case 2:
        return overMastery.b ? [noValue, ...overMastery.b] : []
      case 3:
        return overMastery.c ? [noValue, ...overMastery.c] : []
      default:
        return []
    }
  }

  function receiveRingValues(index: number, left: number, right: number) {
    if (index === 0 || index === 1) {
      // For rings 1 and 2 (indices 0 and 1), update using the synced function.
      setSyncedRingValues(index as 0 | 1, right)
    } else if (index === 2 && left === 0) {
      // If ring 3 (index 2) is being unset (left is 0), then also unset ring 4.
      setRings((prev) => {
        const newRings = [...prev]
        newRings[2] = { modifier: 0, strength: 0 }
        newRings[3] = { modifier: 0, strength: 0 }
        return newRings
      })
    } else {
      // For any other case (including ring 4 being unset), update only that ring.
      setRings((prev) => {
        const newRings = [...prev]
        newRings[index] = { modifier: left, strength: right }
        return newRings
      })
    }
  }

  function setSyncedRingValues(changedIndex: 0 | 1, newStrength: number) {
    // Assume dataSet(0) holds the attack-related data and dataSet(1) holds the HP-related data.
    // (Adjust these calls if your datasets are in different positions.)
    const attackItem = dataSet(0)[0] as ItemSkill
    const hpItem = dataSet(1)[0] as ItemSkill

    const attackValues: number[] = attackItem.values ?? []
    const hpValues: number[] = hpItem.values ?? []

    // Determine the index based on which ring changed:
    const selectedIndex =
      changedIndex === 0
        ? attackValues.indexOf(newStrength)
        : hpValues.indexOf(newStrength)

    // If the new strength value isn’t found, do nothing.
    if (selectedIndex === -1) {
      return
    }

    // Get the corresponding values for both rings.
    const newAttackValue = attackValues[selectedIndex] ?? 0
    const newHpValue = hpValues[selectedIndex] ?? 0

    // Update both ring values simultaneously.
    setRings((prev) => {
      const newRings = [...prev]
      newRings[0] = { modifier: 1, strength: newAttackValue }
      newRings[1] = { modifier: 2, strength: newHpValue }
      return newRings
    })
  }

  return (
    <div className={styles.rings}>
      {rings.map((ringStat, i) => {
        return (
          <ExtendedMasterySelect
            name={`ring-${i}`}
            object="ring"
            key={`ring-${i}`}
            dataSet={dataSet(i)}
            leftSelectDisabled={i === 0 || i === 1}
            leftSelectValue={ringStat?.modifier ?? 0}
            rightSelectValue={ringStat?.strength ?? 0}
            sendValues={(left: number, right: number) => {
              receiveRingValues(i, left, right)
            }}
          />
        )
      })}
    </div>
  )
}

export default RingSelect
