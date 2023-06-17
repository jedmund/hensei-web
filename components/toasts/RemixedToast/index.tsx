import React from 'react'
import Toast from '~components/common/Toast'
import { Trans, useTranslation } from 'next-i18next'

import './index.scss'

interface Props {
  partyName: string
  open: boolean
  onActionClick?: () => void
  onOpenChange: (open: boolean) => void
  onCloseClick: () => void
}

const RemixedToast = ({
  partyName,
  open,
  onOpenChange,
  onCloseClick,
}: Props) => {
  const { t } = useTranslation('common')

  // Methods: Event handlers
  function handleOpenChange() {
    onOpenChange(open)
  }

  function handleCloseClick() {
    onCloseClick()
  }

  return (
    <Toast
      altText={t('toasts.remixed', { title: partyName })}
      open={open}
      duration={2400}
      type="foreground"
      content={
        <Trans i18nKey="toasts.remixed">
          You remixed <strong>{{ title: partyName }}</strong>
        </Trans>
      }
      onOpenChange={handleOpenChange}
      onCloseClick={handleCloseClick}
    />
  )
}

export default RemixedToast
