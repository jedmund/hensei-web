import React, { useState } from 'react'
import UncapStar from '~components/uncap/UncapStar'
import TranscendencePopover from '~components/uncap/TranscendencePopover'
import TranscendenceStar from '~components/uncap/TranscendenceStar'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props extends React.ComponentProps<'div'> {
  type: 'character' | 'weapon' | 'summon'
  rarity?: number
  uncapLevel?: number
  position?: number
  transcendenceStage?: number
  editable: boolean
  flb: boolean
  ulb: boolean
  transcendence?: boolean
  special: boolean
  updateUncap?: (index: number) => void
  updateTranscendence?: (index: number) => void
}

const UncapIndicator = (props: Props) => {
  const numStars = setNumStars()

  const [popoverOpen, setPopoverOpen] = useState(false)

  const transcendenceStarRef = React.createRef<HTMLDivElement>()

  const classes = classNames(
    {
      [styles.wrapper]: true,
    },
    props.className?.split(' ').map((className) => styles[className])
  )

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
      if (props.transcendence) {
        numStars = 6
      } else if (props.ulb) {
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

  function togglePopover(open: boolean) {
    setPopoverOpen(open)
  }

  function sendTranscendenceStage(stage: number) {
    if (props.updateTranscendence) props.updateTranscendence(stage)
    setPopoverOpen(false)
  }

  function handleStarClicked() {
    if (props.editable) togglePopover(!popoverOpen)
  }

  const transcendence = (i: number) => {
    const tabIndex = props.position ? props.position * 7 + i + 1 : 0
    return (
      <TranscendencePopover
        open={popoverOpen}
        stage={props.transcendenceStage || 0}
        type={props.type}
        onOpenChange={togglePopover}
        sendValue={sendTranscendenceStage}
        key={`popover_${i}_${popoverOpen}`}
        starRef={transcendenceStarRef}
        tabIndex={tabIndex}
      >
        <TranscendenceStar
          key={`star_${i}`}
          stage={props.transcendenceStage || 0}
          editable={props.editable}
          interactive={false}
          ref={transcendenceStarRef}
          onStarClick={handleStarClicked}
        />
      </TranscendencePopover>
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
        onStarClick={toggleStar}
        tabIndex={props.position ? props.position * 7 + i + 1 : 0}
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
        onStarClick={toggleStar}
        tabIndex={props.position ? props.position * 7 + i + 1 : 0}
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
        onStarClick={toggleStar}
        tabIndex={props.position ? props.position * 7 + i + 1 : 0}
      />
    )
  }

  const renderStar = (i: number) => {
    if (props.type === 'weapon' && i > 4) {
      return transcendence(i)
    }

    if (props.type === 'character' && i > 4) {
      return props.special ? ulb(i) : transcendence(i)
    }

    if (props.type === 'summon' && i > 4) {
      return transcendence(i)
    }
    if (
      (props.special && props.type === 'character' && i === 3) ||
      (props.type === 'character' && i === 4) ||
      (props.type !== 'character' && i > 2)
    ) {
      return flb(i)
    }

    return mlb(i)
  }

  return (
    <div className={classes}>
      <ul className={styles.indicator}>
        {Array.from(Array(numStars)).map((_, i) => renderStar(i))}
      </ul>
    </div>
  )
}

UncapIndicator.defaultProps = {
  editable: false,
}

export default UncapIndicator
