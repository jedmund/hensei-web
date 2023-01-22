import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import './index.scss'
import TranscendenceFragment from '~components/TranscendenceFragment'

interface Props {
  className?: string
  stage: number
  editable: boolean
  interactive: boolean
  onClick?: () => void
  onFragmentClick?: (newStage: number) => void
  onFragmentHover?: (newStage: number) => void
}

const NUM_FRAGMENTS = 5

const TranscendenceStar = ({
  className,
  interactive,
  stage,
  editable,
  onClick,
  onFragmentClick,
  onFragmentHover,
}: Props) => {
  const [visibleStage, setVisibleStage] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  // Classes
  const starClasses = classnames({
    TranscendenceStar: true,
    Immutable: !editable,
  })

  const baseImageClasses = classnames(className, {
    Figure: true,
  })

  useEffect(() => {
    setVisibleStage(stage)
    setCurrentStage(stage)
  }, [stage])

  function handleClick() {
    if (onClick) {
      onClick()
    }
  }

  function handleFragmentClick(index: number) {
    let newStage = index
    if (index === currentStage) newStage = 0

    setVisibleStage(newStage)
    setCurrentStage(newStage)
    if (onFragmentClick) onFragmentClick(newStage)
  }

  function handleFragmentHover(index: number) {
    setVisibleStage(index)
    if (onFragmentHover) onFragmentHover(index)
  }

  function handleMouseLeave() {
    setVisibleStage(currentStage)
    if (onFragmentHover) onFragmentHover(currentStage)
  }

  return (
    <li
      className={starClasses}
      onClick={interactive ? handleClick : () => {}}
      onMouseLeave={interactive ? handleMouseLeave : () => {}}
    >
      <div className="Fragments">
        {[...Array(NUM_FRAGMENTS)].map((e, i) => {
          const loopStage = i + 1
          return (
            <TranscendenceFragment
              key={`fragment_${loopStage}`}
              stage={loopStage}
              visible={loopStage <= visibleStage}
              interactive={interactive}
              onClick={interactive ? handleFragmentClick : () => {}}
              onHover={interactive ? handleFragmentHover : () => {}}
            />
          )
        })}
      </div>
      <i className={baseImageClasses} />
    </li>
  )
}

TranscendenceStar.defaultProps = {
  stage: 0,
  editable: false,
  interactive: false,
}

export default TranscendenceStar
