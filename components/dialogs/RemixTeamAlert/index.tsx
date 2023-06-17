import React from 'react'
import { Trans, useTranslation } from 'next-i18next'
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
  const { t } = useTranslation('common')

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
          <Trans i18nKey="modals.remix_team.description.creator">
            Remixing a team makes a copy of it in your account so you can make
            your own changes.\n\nYou&apos;re already the creator of{' '}
            <strong>{{ name: name }}</strong>, are you sure you want to remix
            it?
          </Trans>
        ) : (
          <Trans i18nKey="modals.remix_team.description.viewer">
            Remixing a team makes a copy of it in your account so you can make
            your own changes.\n\nWould you like to remix{' '}
            <strong>{{ name: 'HEY' }}</strong>?
          </Trans>
        )
      }
    />
  )
}

export default RemixTeamAlert
