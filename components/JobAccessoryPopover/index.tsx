import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import * as RadioGroup from '@radix-ui/react-radio-group'

import Button from '~components/Button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '~components/PopoverContent'
import JobAccessoryItem from '~components/JobAccessoryItem'

import './index.scss'

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
  const { t } = useTranslation('common')

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Component state
  const [open, setOpen] = useState(false)

  // Hooks
  useEffect(() => {
    setOpen(modalOpen)
  }, [modalOpen])

  // Event handlers
  function handleAccessorySelected() {
    onAccessorySelected
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
    <RadioGroup.Root
      className="Accessories"
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
  )

  const readOnly = currentAccessory ? (
    <div className="JobAccessory">
      <img
        alt={currentAccessory.name[locale]}
        src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/accessory-grid/${currentAccessory.granblue_id}.jpg`}
      />
      <h4>{currentAccessory.name[locale]}</h4>
    </div>
  ) : (
    <h3>
      No shield selected
      {/* {t('no_accessory', { job: job.name.en.replace(' ', '-').toLowerCase() })} */}
    </h3>
  )

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="JobAccessory"
        onEscapeKeyDown={closePopover}
        onPointerDownOutside={handlePointerDownOutside}
      >
        {editable ? radioGroup : readOnly}
      </PopoverContent>
    </Popover>
  )
}

export default JobAccessoryPopover
