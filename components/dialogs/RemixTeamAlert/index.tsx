import React from 'react'
import { useTranslations } from 'next-intl'
import Alert from '~components/common/Alert'

interface Props {
  creator: boolean
  name: string
  open: boolean
  remixCallback: () => void
  onOpenChange: (open: boolean) => void
}

const RemixTeamAlert = ({
  creator,
  name,
  open,
  remixCallback,
  onOpenChange,
}: Props) => {
  const t = useTranslations('common')

  function remixParty() {
    remixCallback()
  }

  function close() {
    onOpenChange(false)
  }

  return (
    <Alert
      open={open}
      primaryAction={remixParty}
      primaryActionText={t('modals.remix_team.buttons.confirm')}
      cancelAction={close}
      cancelActionText={t('modals.remix_team.buttons.cancel')}
      message={
        creator ? (
          <>
            {t.rich('modals.remix_team.description.creator', {
              name: name,
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </>
        ) : (
          <>
            {t.rich('modals.remix_team.description.viewer', {
              name: name,
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </>
        )
      }
    />
  )
}

export default RemixTeamAlert
