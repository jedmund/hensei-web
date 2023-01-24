import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Button from '~components/Button'
import ShieldIcon from '~public/icons/Shield.svg'
import './index.scss'

interface Props {
  job?: Job
  user?: User
  onAccessoryButtonClicked: () => void
}

const ACCESSORY_JOB_IDS = ['683ffee8-4ea2-432d-bc30-4865020ac9f4']

const JobImage = ({ job, user, onAccessoryButtonClicked }: Props) => {
  // Localization
  const { t } = useTranslation('common')

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

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

  // Elements
  const accessoryButton = () => {
    return (
      <Button
        accessoryIcon={<ShieldIcon />}
        className="JobAccessory"
        onClick={onAccessoryButtonClicked}
      />
    )
  }

  return (
    <div className="JobImage">
      {hasAccessory ? accessoryButton() : ''}
      {job && job.id !== '-1' ? image : ''}
      <div className="Job Overlay" />
    </div>
  )
}

export default JobImage
