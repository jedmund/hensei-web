'use client'
import React from 'react'
import { setCookie } from 'cookies-next'
import { add, format } from 'date-fns'
import classNames from 'classnames'

import Button from '~components/common/Button'
import Toast from '~components/common/Toast'

import styles from './index.module.scss'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  updateType: string
  lastUpdated: string
  onActionClicked: () => void
  onCloseClicked: () => void
}

const UpdateToast = ({
  open,
  updateType,
  lastUpdated,
  onActionClicked,
  onCloseClicked,
}: Props) => {
  const t = useTranslations('common')

  const classes = classNames({
    Update: true,
  })

  function setToastCookie() {
    const updatedAt = new Date(lastUpdated)
    const expiresAt = add(updatedAt, { days: 7 })
    setCookie(
      `update-${format(updatedAt, 'yyyy-MM-dd')}`,
      { seen: true },
      { path: '/', expires: expiresAt }
    )
  }

  function handleButtonClicked() {
    window.open('/updates', '_blank')
    setToastCookie()
    onActionClicked()
  }

  function handleCloseClicked() {
    setToastCookie()
    onCloseClicked()
  }

  return (
    <Toast
      altText={t(`toasts.update.description.${updateType}`)}
      className={classes}
      title={t(`toasts.update.title`)}
      content={t(`toasts.update.description.${updateType}`)}
      open={open}
      type="background"
      onCloseClick={handleCloseClicked}
    >
      <Button
        size="small"
        bound={true}
        onClick={handleButtonClicked}
        text={t('toasts.update.button')}
      />
    </Toast>
  )
}

export default UpdateToast
