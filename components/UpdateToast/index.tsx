import React from 'react'
import classNames from 'classnames'

import Button from '~components/Button'
import Toast from '~components/Toast'

import './index.scss'
import { useTranslation } from 'next-i18next'

interface Props {}

const UpdateToast = (props: Props) => {
  const { t } = useTranslation('updates')

  const classes = classNames({
    Update: true,
  })

  return (
    <Toast
      className={classes}
      title={t('updates.latest.title')}
      content={t('updates.latest.content')}
    >
      <Button buttonSize="small" contained={true} text="" />
    </Toast>
  )
}

export default UpdateToast
