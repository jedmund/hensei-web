import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { Popover } from '@radix-ui/react-popover'
import {
  PopoverAnchor,
  PopoverContent,
} from '~components/common/PopoverContent'
import TranscendenceStar from '~components/uncap/TranscendenceStar'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.DialogHTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  type: 'character' | 'summon'
  starRef: React.RefObject<HTMLDivElement>
  open: boolean
  stage: number
  onOpenChange?: (open: boolean) => void
  sendValue?: (stage: number) => void
}

const TranscendencePopover = ({
  open: popoverOpen,
  starRef,
  children,
  type,
  stage,
  tabIndex,
  onOpenChange,
  sendValue,
}: PropsWithChildren<Props>) => {
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)
  const [baseLevel, setBaseLevel] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  const popoverRef = React.createRef<HTMLDivElement>()

  const levelClasses = classNames({
    [styles.pending]: stage != currentStage,
  })

  useEffect(() => {
    setOpen(popoverOpen)
  }, [popoverOpen])

  useEffect(() => {
    if (stage) setCurrentStage(stage)
  }, [stage])

  useEffect(() => {
    if (type === 'character') setBaseLevel(100)
    else if (type === 'summon') setBaseLevel(200)
  }, [type])

  function handleFragmentClicked(newStage: number) {
    setCurrentStage(newStage)
    if (sendValue) sendValue(newStage)
  }

  function handleFragmentHovered(newStage: number) {
    setCurrentStage(newStage)
  }

  function closePopover() {
    setOpen(false)
    if (onOpenChange) onOpenChange(false)
  }

  function handlePointerDownOutside(
    event: CustomEvent<{ originalEvent: PointerEvent }>
  ) {
    const target = event.detail.originalEvent.target as Element
    if (
      target &&
      starRef.current &&
      target.closest('.TranscendenceStar') !== starRef.current
    ) {
      closePopover()
    }
  }

  return (
    <Popover open={open}>
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent
        className="transcendence"
        ref={popoverRef}
        tabIndex={tabIndex}
        onEscapeKeyDown={closePopover}
        onPointerDownOutside={handlePointerDownOutside}
      >
        <TranscendenceStar
          className="interactive base"
          editable={true}
          interactive={true}
          stage={stage}
          onFragmentClick={handleFragmentClicked}
          onFragmentHover={handleFragmentHovered}
        />
        <h4 className="name">
          <span>{t('level')}&nbsp;</span>
          <span className={levelClasses}>{baseLevel + 10 * currentStage}</span>
        </h4>
      </PopoverContent>
    </Popover>
  )
}

export default TranscendencePopover
