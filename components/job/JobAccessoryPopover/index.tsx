'use client'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'

import capitalizeFirstLetter from '~utils/capitalizeFirstLetter'

import * as RadioGroup from '@radix-ui/react-radio-group'
import Button from '~components/common/Button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '~components/common/PopoverContent'
import JobAccessoryItem from '~components/job/JobAccessoryItem'

import styles from './index.module.scss'

interface Props {
  buttonref: React.RefObject<HTMLButtonElement>
  currentAccessory?: JobAccessory
  accessories: JobAccessory[]
  editable: boolean
  open: boolean
  job: Job
  onAccessorySelected: (value: string) => void
  onOpenChange: (open: boolean) => void
}

const JobAccessoryPopover = ({
  buttonref,
  currentAccessory,
  accessories,
  editable,
  open: modalOpen,
  children,
  job,
  onAccessorySelected,
  onOpenChange,
}: PropsWithChildren<Props>) => {
  // Localization
  const t = useTranslations('common')

  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  // Component state
  const [open, setOpen] = useState(false)

  const classes = classNames({
    jobAccessory: true,
    readOnly: !editable,
  })

  // Hooks
  useEffect(() => {
    setOpen(modalOpen)
  }, [modalOpen])

  // Event handlers
  function handleAccessorySelected(value: string) {
    onAccessorySelected(value)
    closePopover()
  }

  function handlePointerDownOutside(
    event: CustomEvent<{ originalEvent: PointerEvent }>
  ) {
    const target = event.detail.originalEvent.target as Element
    if (
      target &&
      buttonref.current &&
      target.closest('.JobAccessory.Button') !== buttonref.current
    ) {
      onOpenChange(false)
    }
  }

  function closePopover() {
    onOpenChange(false)
  }

  const radioGroup = (
    <>
      <h3>
        {capitalizeFirstLetter(
          job.accessory_type === 1
            ? `${t('accessories.paladin')}s`
            : t('accessories.manadiver')
        )}
      </h3>
      <RadioGroup.Root
        className={styles.accessories}
        onValueChange={handleAccessorySelected}
      >
        {accessories.map((accessory) => (
          <JobAccessoryItem
            accessory={accessory}
            key={accessory.id}
            selected={
              currentAccessory && currentAccessory.id === accessory.id
                ? true
                : false
            }
          />
        ))}
      </RadioGroup.Root>
    </>
  )

  const readOnly = currentAccessory ? (
    <div className={styles.equippedAccessory}>
      <h3>
        {t('equipped')}{' '}
        {job.accessory_type === 1
          ? `${t('accessories.paladin')}s`
          : t('accessories.manadiver')}
      </h3>
      <div className={styles.accessory}>
        <img
          alt={currentAccessory.name[locale]}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/accessory-grid/${currentAccessory.granblue_id}.jpg`}
        />
        <h4>{currentAccessory.name[locale]}</h4>
      </div>
    </div>
  ) : (
    <h3>
      {t('no_accessory', {
        accessory: t(
          `accessories.${job.accessory_type === 1 ? 'paladin' : 'manadiver'}`
        ),
      })}
    </h3>
  )

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={classes}
        onEscapeKeyDown={closePopover}
        onPointerDownOutside={handlePointerDownOutside}
      >
        {editable ? radioGroup : readOnly}
      </PopoverContent>
    </Popover>
  )
}

export default JobAccessoryPopover
