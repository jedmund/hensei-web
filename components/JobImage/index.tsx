import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { ACCESSORY_JOB_IDS } from '~utils/jobsWithAccessories'

import Button from '~components/Button'
import JobAccessoryPopover from '~components/JobAccessoryPopover'

import ShieldIcon from '~public/icons/Shield.svg'
import './index.scss'

interface Props {
  job?: Job
  currentAccessory?: JobAccessory
  accessories?: JobAccessory[]
  editable: boolean
  user?: User
  onAccessorySelected: (value: string) => void
}

const JobImage = ({
  job,
  currentAccessory,
  editable,
  accessories,
  user,
  onAccessorySelected,
}: Props) => {
  // Localization
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Component state
  const [open, setOpen] = useState(false)

  // Refs
  const buttonRef = React.createRef<HTMLButtonElement>()

  // Static variables
  const imageUrl = () => {
    let source = ''

    if (job) {
      const slug = job.name.en.replaceAll(' ', '-').toLowerCase()
      const gender = user && user.gender == 1 ? 'b' : 'a'
      source = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/jobs/${slug}_${gender}.png`
    }

    return source
  }

  const hasAccessory = job && ACCESSORY_JOB_IDS.includes(job.id)
  const image = <img alt={job?.name[locale]} src={imageUrl()} />

  function handleAccessoryButtonClicked() {
    setOpen(!open)
  }

  function handlePopoverOpenChanged(open: boolean) {
    setOpen(open)
  }

  // Elements
  const accessoryButton = () => {
    return (
      <Button
        accessoryIcon={<ShieldIcon />}
        className="JobAccessory"
        onClick={handleAccessoryButtonClicked}
        ref={buttonRef}
      />
    )
  }

  const accessoryPopover = () => {
    return job && accessories ? (
      <JobAccessoryPopover
        buttonref={buttonRef}
        currentAccessory={currentAccessory}
        accessories={accessories}
        editable={editable}
        open={open}
        job={job}
        onAccessorySelected={onAccessorySelected}
        onOpenChange={handlePopoverOpenChanged}
      >
        {accessoryButton()}
      </JobAccessoryPopover>
    ) : (
      ''
    )
  }
  return (
    <div className="JobImage">
      {hasAccessory ? accessoryPopover() : ''}
      {job && job.id !== '-1' ? image : ''}
      <div className="Job Overlay" />
    </div>
  )
}

export default JobImage
