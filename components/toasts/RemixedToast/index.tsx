import React, { useEffect } from 'react'
import Toast from '~components/common/Toast'
import { useTranslations } from 'next-intl'

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
      altText={t('toasts.remixed_alt', { title: partyName })}
      open={open}
      duration={2400}
      type="foreground"
      content={
        <>
          {t.rich('toasts.remixed', {
            title: partyName,
            strong: (chunks) => <strong>{chunks}</strong>
          })}
        </>
      }
      onOpenChange={handleOpenChange}
      onCloseClick={handleCloseClick}
    />
  )
}

export default RemixedToast
