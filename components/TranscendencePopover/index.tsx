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
    const handleClickOutside = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null

      console.log('Handling click outside...?')

      console.log(popoverRef.current)
      console.log(open)

      if (
        popoverRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        open &&
        onOpenChange
      ) {
        onOpenChange(false)
      }
    }

    document.addEventListener('click', handleClickOutside, true)

    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [onOpenChange])

  useEffect(() => {
    if (open) popoverRef.current?.focus()
  }, [])

  useEffect(() => {
    setCurrentStage(stage)
  }, [stage])

  useEffect(() => {
    setOpen(popoverOpen)

    if (popoverOpen) {
      console.log(popoverRef.current)
      popoverRef.current?.focus()
    }
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
          <span className={levelClasses}>{100 + 10 * currentStage}</span>
        </h4>
      </PopoverContent>
    </Popover>
  )
}

export default TranscendencePopover
