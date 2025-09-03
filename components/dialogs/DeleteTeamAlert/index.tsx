import React from 'react'
import { useTranslations } from 'next-intl'
import Alert from '~components/common/Alert'

interface Props {
  open: boolean
  deleteCallback: () => void
  onOpenChange: (open: boolean) => void
}

const DeleteTeamAlert = ({ open, deleteCallback, onOpenChange }: Props) => {
  const t = useTranslations('common')

  function deleteParty() {
    deleteCallback()
  }

  function close() {
    onOpenChange(false)
  }

  return (
    <Alert
      open={open}
      primaryAction={deleteParty}
      primaryActionClassName="Destructive"
      primaryActionText={t('modals.delete_team.buttons.confirm')}
      cancelAction={close}
      cancelActionText={t('modals.delete_team.buttons.cancel')}
      message={t('modals.delete_team.description')}
    />
  )
}

export default DeleteTeamAlert
