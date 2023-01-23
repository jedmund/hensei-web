import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { Popover, PopoverAnchor, PopoverContent } from '~components/Popover'
import TranscendenceStar from '~components/TranscendenceStar'

import './index.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  open: boolean
  stage: number
  onOpenChange?: (open: boolean) => void
  sendValue?: (stage: number) => void
}

const TranscendencePopover = ({
  children,
  open: popoverOpen,
  stage,
  tabIndex,
  onOpenChange,
  sendValue,
}: PropsWithChildren<Props>) => {
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)

  const [currentStage, setCurrentStage] = useState(0)

  const popoverRef = React.createRef<HTMLDivElement>()

  const classes = classNames({
    Transcendence: true,
  })

  const levelClasses = classNames({
    Pending: stage != currentStage,
  })

  useEffect(() => {
    if (open) popoverRef.current?.focus()
  }, [])

  useEffect(() => {
    setCurrentStage(stage)
  }, [stage])

  useEffect(() => {
    setOpen(popoverOpen)
  }, [popoverOpen])

  function handleFragmentClicked(newStage: number) {
    setCurrentStage(newStage)
    if (sendValue) sendValue(newStage)
  }

  function handleFragmentHovered(newStage: number) {
    setCurrentStage(newStage)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    console.log(`Key pressed, ${event.key}`)
    console.log(window.event)
    if (event.key === 'Escape') {
      if (onOpenChange) onOpenChange(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent className={classes} ref={popoverRef} tabIndex={tabIndex}>
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
          <span className={levelClasses}>{200 + 10 * currentStage}</span>
        </h4>
      </PopoverContent>
    </Popover>
  )
}

export default TranscendencePopover
