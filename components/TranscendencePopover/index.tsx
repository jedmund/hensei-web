import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import TranscendenceStar from '~components/TranscendenceStar'
import './index.scss'

interface Props {
  className?: string
  open: boolean
  stage: number
  sendValue?: (stage: number) => void
}

const TranscendencePopover = ({
  className,
  open: popoverOpen,
  stage,
  sendValue,
}: Props) => {
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)

  const [currentStage, setCurrentStage] = useState(0)

  const classes = classNames({
    Transcendence: true,
    Popover: true,
    open: open,
  })

  const levelClasses = classNames({
    Pending: stage != currentStage,
  })

  useEffect(() => {
    setCurrentStage(stage)
  }, [stage])

  useEffect(() => {
    console.log(`Setting popover state to ${popoverOpen}`)
    setOpen(popoverOpen)
  }, [popoverOpen])

  function handleFragmentClicked(newStage: number) {
    setCurrentStage(newStage)
    if (sendValue) sendValue(newStage)
  }

  function handleFragmentHovered(newStage: number) {
    setCurrentStage(newStage)
  }

  return (
    <div className={classes}>
      <TranscendenceStar
        className="Interactive Base"
        editable={true}
        interactive={true}
        stage={stage}
        onFragmentClick={handleFragmentClicked}
        onFragmentHover={handleFragmentHovered}
      />
      <h4>
        <span>{t('level')}&nbsp;</span>
        <span className={levelClasses}>{100 + 10 * currentStage}</span>
      </h4>
    </div>
  )
}

export default TranscendencePopover
