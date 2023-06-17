import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import 'fix-date'

import './index.scss'

interface Props {
  grid: {
    mainSummon: GridSummon | undefined
    friendSummon: GridSummon | undefined
    allSummons: GridArray<GridSummon>
  }
}

const SUMMONS_COUNT = 4

const SummonRep = (props: Props) => {
  // Localization for alt tags
  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Component state
  const [mainSummon, setMainSummon] = useState<GridSummon>()
  const [summons, setSummons] = useState<GridArray<Summon>>({})
  const [grid, setGrid] = useState<GridArray<GridSummon>>({})

  // On grid update
  useEffect(() => {
    const newSummons = Array(SUMMONS_COUNT)
    const gridSummons = Array(SUMMONS_COUNT)

    if (props.grid.mainSummon) {
      setMainSummon(props.grid.mainSummon)
    }

    if (props.grid.allSummons) {
      for (const [key, value] of Object.entries(props.grid.allSummons)) {
        if (value) {
          newSummons[value.position] = value.object
          gridSummons[value.position] = value
        }
      }
    }

    setSummons(newSummons)
    setGrid(gridSummons)
  }, [props.grid])

  // Methods: Image generation
  function generateMainImage() {
    let url = ''

    const upgradedSummons = [
      '2040094000',
      '2040100000',
      '2040080000',
      '2040098000',
      '2040090000',
      '2040084000',
      '2040003000',
      '2040056000',
      '2040020000',
      '2040034000',
      '2040028000',
      '2040027000',
      '2040046000',
      '2040047000',
    ]

    if (mainSummon) {
      // Change the image based on the uncap level
      let suffix = ''
      if (mainSummon.object.uncap.xlb && mainSummon.uncap_level == 6) {
        if (
          mainSummon.transcendence_step >= 1 &&
          mainSummon.transcendence_step < 5
        ) {
          suffix = '_03'
        } else if (mainSummon.transcendence_step === 5) {
          suffix = '_04'
        }
      } else if (
        upgradedSummons.indexOf(mainSummon.object.granblue_id.toString()) !=
          -1 &&
        mainSummon.uncap_level == 5
      ) {
        suffix = '_02'
      }

      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-main/${mainSummon.object.granblue_id}${suffix}.jpg`
    }

    return mainSummon ? (
      <img alt={mainSummon.object.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  function generateGridImage(position: number) {
    let url = ''

    const summon = summons[position]
    const gridSummon = grid[position]

    const upgradedSummons = [
      '2040094000',
      '2040100000',
      '2040080000',
      '2040098000',
      '2040090000',
      '2040084000',
      '2040003000',
      '2040056000',
      '2040020000',
      '2040034000',
      '2040028000',
      '2040027000',
      '2040046000',
      '2040047000',
    ]

    if (summon && gridSummon) {
      // Change the image based on the uncap level
      let suffix = ''
      if (gridSummon.object.uncap.xlb && gridSummon.uncap_level == 6) {
        if (
          gridSummon.transcendence_step >= 1 &&
          gridSummon.transcendence_step < 5
        ) {
          suffix = '_03'
        } else if (gridSummon.transcendence_step === 5) {
          suffix = '_04'
        }
      } else if (
        upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 &&
        gridSummon.uncap_level == 5
      ) {
        suffix = '_02'
      }

      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
    }

    return summons[position] ? (
      <img alt={summons[position]?.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  // Render
  return (
    <div className="SummonRep Rep">
      <div className="Main Summon">{generateMainImage()}</div>
      <ul className="GridSummons">
        {Array.from(Array(SUMMONS_COUNT)).map((x, i) => {
          return (
            <li key={`summons-${i + 1}`} className="Grid Summon">
              {generateGridImage(i + 1)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SummonRep
