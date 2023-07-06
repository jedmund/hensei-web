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
  open: boolean
  stage: number
  onOpenChange?: (open: boolean) => void
  sendValue?: (stage: number) => void
}

const TranscendencePopover = ({
  children,
  open: popoverOpen,
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
    if (open) popoverRef.current?.focus()
  }, [])

  useEffect(() => {
    if (stage) setCurrentStage(stage)
  }, [stage])

  useEffect(() => {
    if (type === 'character') setBaseLevel(100)
    else if (type === 'summon') setBaseLevel(200)
  }, [type])

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

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent
        className={styles.transcendence}
        ref={popoverRef}
        tabIndex={tabIndex}
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
