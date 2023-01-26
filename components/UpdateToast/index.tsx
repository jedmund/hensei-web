import React from 'react'
import { useRouter } from 'next/router'
import { setCookie } from 'cookies-next'
import { add, format } from 'date-fns'
import classNames from 'classnames'

import Button from '~components/Button'
import Toast from '~components/Toast'

import './index.scss'
import { useTranslation } from 'next-i18next'

interface Props {
  open: boolean
  updateType: 'feature' | 'content'
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
  const { t } = useTranslation('roadmap')

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
    window.open('/about', '_blank')
    setToastCookie()
    onActionClicked()
  }

  function handleCloseClicked() {
    setToastCookie()
    onCloseClicked()
  }

  return (
    <Toast
      className={classes}
      title={t(`toasts.title`)}
      content={t(`toasts.description.${updateType}`)}
      open={open}
      type="background"
      onCloseClick={handleCloseClicked}
    >
      <Button
        buttonSize="small"
        contained={true}
        onClick={handleButtonClicked}
        text={t('toasts.button')}
      />
    </Toast>
  )
}

export default UpdateToast
