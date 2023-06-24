import React, { useState } from 'react'
import { useRouter } from 'next/router'
import classNames from 'classnames'
import Button from '~components/common/Button'
import JobAccessoryPopover from '~components/job/JobAccessoryPopover'

import ShieldIcon from '~public/icons/Shield.svg'
import ManaturaIcon from '~public/icons/Manatura.svg'

import styles from './index.module.scss'

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

  const hasAccessory = job && job.accessory
  const image = <img alt={job?.name[locale]} src={imageUrl()} />

  const classes = classNames({
    JobAccessory: true,
    Selected: open,
  })

  function handleAccessoryButtonClicked() {
    setOpen(!open)
  }

  function handlePopoverOpenChanged(open: boolean) {
    setOpen(open)
  }

  // Elements
  const accessoryButton = () => {
    let icon

    if (job && job.accessory_type === 1) icon = <ShieldIcon />
    else if (job && job.accessory_type === 2) icon = <ManaturaIcon />

    return (
      <Button
        leftAccessoryIcon={icon}
        className={classes}
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
    <div className={styles.image}>
      {hasAccessory ? accessoryPopover() : ''}
      {job && job.id !== '-1' ? image : ''}
      <div className={styles.overlay} />
    </div>
  )
}

export default JobImage
