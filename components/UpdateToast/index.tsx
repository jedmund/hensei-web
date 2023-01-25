import React from 'react'
import classNames from 'classnames'

import Button from '~components/Button'
import Toast from '~components/Toast'

import './index.scss'
import { useTranslation } from 'next-i18next'

interface Props {
  open: boolean
  updateType: 'feature' | 'content'
}

const UpdateToast = (props: Props) => {
  const { t } = useTranslation('roadmap')

  const classes = classNames({
    Update: true,
  })

  return (
    <Toast
      className={classes}
      title={t(`toasts.title`)}
      content={t(`toasts.description.${props.updateType}`)}
      open={true}
      type="background"
    >
      <Button buttonSize="small" contained={true} text={t('toasts.button')} />
    </Toast>
  )
}

export default UpdateToast
