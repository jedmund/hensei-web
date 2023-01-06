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

const emptyRing: ExtendedMastery = {
  modifier: 0,
  strength: 0,
}

interface Props {
  gridCharacter: GridCharacter
  sendValues: (overMastery: CharacterOverMastery) => void
}

const RingSelect = (props: Props) => {
  // Ring value states
  const [rings, setRings] = useState<CharacterOverMastery>({
    1: { ...emptyRing, modifier: 1 },
    2: { ...emptyRing, modifier: 2 },
    3: emptyRing,
    4: emptyRing,
  })


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

  }

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
