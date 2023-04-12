import React, { useEffect, useState } from 'react'
import classnames from 'classnames'

import TranscendenceFragment from '~components/uncap/TranscendenceFragment'
import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  className?: string
  stage: number
  editable: boolean
  interactive: boolean
  onStarClick?: () => void
  onFragmentClick?: (newStage: number) => void
  onFragmentHover?: (newStage: number) => void
}

const NUM_FRAGMENTS = 5

const TranscendenceStar = ({
  className,
  interactive,
  stage,
  editable,
  tabIndex,
  onStarClick,
  onFragmentClick,
  onFragmentHover,
}: Props) => {
  const [visibleStage, setVisibleStage] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  const [immutable, setImmutable] = useState(false)

  // Classes
  const starClasses = classnames({
    TranscendenceStar: true,
    Immutable: immutable,
    Empty: stage === 0,
    Stage1: stage === 1,
    Stage2: stage === 2,
    Stage3: stage === 3,
    Stage4: stage === 4,
    Stage5: stage === 5,
  })

  const baseImageClasses = classnames(className, {
    Figure: true,
  })

  useEffect(() => {
    setVisibleStage(stage)
    setCurrentStage(stage)
  }, [stage])

  function handleClick() {
    if (onStarClick) {
      onStarClick()
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
    <div
      className={starClasses}
      onClick={editable ? handleClick : () => {}}
      onMouseLeave={interactive ? handleMouseLeave : () => {}}
      tabIndex={tabIndex}
    >
      <div className="Fragments">
        {[...Array(NUM_FRAGMENTS)].map((e, i) => {
          const loopStage = i + 1
          return interactive ? (
            <TranscendenceFragment
              key={`fragment_${loopStage}`}
              stage={loopStage}
              visible={loopStage <= visibleStage}
              interactive={interactive}
              onClick={handleFragmentClick}
              onHover={handleFragmentHover}
            />
          ) : (
            ''
          )
        })}
      </div>
      <i className={baseImageClasses} />
    </div>
  )
}

TranscendenceStar.defaultProps = {
  stage: 0,
  editable: false,
  interactive: false,
}

export default TranscendenceStar
