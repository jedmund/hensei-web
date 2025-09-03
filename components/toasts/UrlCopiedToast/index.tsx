import React from 'react'
import Toast from '~components/common/Toast'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  onActionClick?: () => void
  onOpenChange: (open: boolean) => void
  onCloseClick: () => void
}

const UrlCopiedToast = ({ open, onOpenChange, onCloseClick }: Props) => {
  const t = useTranslations('common')

  // Methods: Event handlers
  function handleOpenChange() {
    onOpenChange(open)
  }

  function handleCloseClick() {
    onCloseClick()
  }

  return (
    <Toast
      altText={t('toasts.copied')}
      open={open}
      duration={2400}
      type="foreground"
      content={t('toasts.copied')}
      onOpenChange={handleOpenChange}
      onCloseClick={handleCloseClick}
    />
  )
}

export default UrlCopiedToast
