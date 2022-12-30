import React from 'react'
import UncapStar from '~components/UncapStar'

import './index.scss'

interface Props {
  type: 'character' | 'weapon' | 'summon'
  rarity?: number
  uncapLevel?: number
  flb: boolean
  ulb: boolean
  special: boolean
  updateUncap?: (index: number) => void
}

const UncapIndicator = (props: Props) => {
  const numStars = setNumStars()
  function setNumStars() {
    let numStars

    if (props.type === 'character') {
      if (props.special) {
        if (props.ulb) {
          numStars = 5
        } else if (props.flb) {
          numStars = 4
        } else {
          numStars = 3
        }
      } else {
        if (props.ulb) {
          numStars = 6
        } else if (props.flb) {
          numStars = 5
        } else {
          numStars = 4
        }
      }
    } else {
      if (props.ulb) {
        numStars = 5
      } else if (props.flb) {
        numStars = 4
      } else {
        numStars = 3
      }
    }

    return numStars
  }

  function toggleStar(index: number, empty: boolean) {
    if (props.updateUncap) {
      if (empty && index > 0) props.updateUncap(index + 1)
      else props.updateUncap(index)
    }
  }

  const transcendence = (i: number) => {
    return (
      <UncapStar
        ulb={true}
        empty={props.uncapLevel ? i >= props.uncapLevel : false}
        key={`star_${i}`}
        index={i}
        onClick={toggleStar}
      />
    )
  }

  const ulb = (i: number) => {
    // console.log('ULB; Number of stars:', props.uncapLevel)
    return (
      <UncapStar
        ulb={true}
        empty={props.uncapLevel != null ? i >= props.uncapLevel : false}
        key={`star_${i}`}
        index={i}
        onClick={toggleStar}
      />
    )
  }

  const flb = (i: number) => {
    // console.log('FLB; Number of stars:', props.uncapLevel)
    return (
      <UncapStar
        flb={true}
        empty={props.uncapLevel != null ? i >= props.uncapLevel : false}
        key={`star_${i}`}
        index={i}
        onClick={toggleStar}
      />
    )
  }

  const mlb = (i: number) => {
    // console.log('MLB; Number of stars:', props.uncapLevel)
    return (
      <UncapStar
        empty={props.uncapLevel != null ? i >= props.uncapLevel : false}
        key={`star_${i}`}
        index={i}
        onClick={toggleStar}
      />
    )
  }

  return (
    <ul className="UncapIndicator">
      {Array.from(Array(numStars)).map((x, i) => {
        if (props.type === 'character' && i > 4) {
          if (props.special) return ulb(i)
          else return transcendence(i)
        } else if (
          (props.special && props.type === 'character' && i == 3) ||
          (props.type === 'character' && i == 4) ||
          (props.type !== 'character' && i > 2)
        ) {
          return flb(i)
        } else {
          return mlb(i)
        }
      })}
    </ul>
  )
}

export default UncapIndicator
