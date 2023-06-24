import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Alert from '~components/common/Alert'
import Button from '~components/common/Button'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/common/ContextMenu'
import ContextMenuItem from '~components/common/ContextMenuItem'

import EllipsisIcon from '~public/icons/Ellipsis.svg'
import PlusIcon from '~public/icons/Add.svg'
import styles from './index.module.scss'

// Props
interface Props extends React.ComponentPropsWithoutRef<'div'> {
  skill?: JobSkill
  position: number
  editable: boolean
  hasJob: boolean
  removeJobSkill: (position: number) => void
}

const JobSkillItem = React.forwardRef<HTMLDivElement, Props>(
  function useJobSkillItem(
    {
      skill,
      position,
      editable,
      hasJob,
      removeJobSkill: sendJobSkillToRemove,
      ...props
    },
    forwardedRef
  ) {
    // Set up translation
    const router = useRouter()
    const { t } = useTranslation('common')
    const locale =
      router.locale && ['en', 'ja'].includes(router.locale)
        ? router.locale
        : 'en'

    // States: Component
    const [alertOpen, setAlertOpen] = useState(false)
    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    // Classes
    const classes = classNames({
      [styles.skill]: true,
      [styles.editable]: editable,
    })

    const imageClasses = classNames({
      [styles.placeholder]: !skill,
      [styles.editable]: editable && hasJob,
    })

    const buttonClasses = classNames({
      [styles.clicked]: contextMenuOpen,
    })

    // Methods: Data mutation
    function removeJobSkill() {
      if (skill) sendJobSkillToRemove(position)
      setAlertOpen(false)
    }

    // Methods: Context menu
    function handleButtonClicked() {
      setContextMenuOpen(!contextMenuOpen)
    }

    function handleContextMenuOpenChange(open: boolean) {
      if (!open) setContextMenuOpen(false)
    }

    const skillImage = () => {
      let jsx: React.ReactNode

      if (skill) {
        jsx = (
          <img
            alt={skill.name[locale]}
            className={imageClasses}
            src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-skills/${skill.slug}.png`}
          />
        )
      } else {
        jsx = (
          <div className={imageClasses}>
            {editable && hasJob ? <PlusIcon /> : ''}
          </div>
        )
      }

      return jsx
    }

    const label = () => {
      let jsx: React.ReactNode

      if (skill) {
        jsx = <p>{skill.name[locale]}</p>
      } else if (editable && hasJob) {
        jsx = (
          <p className={styles.placeholder}>
            {t('job_skills.state.selectable')}
          </p>
        )
      } else {
        jsx = (
          <p className={styles.placeholder}>{t('job_skills.state.no_skill')}</p>
        )
      }

      return jsx
    }

    const removeAlert = () => {
      return (
        <Alert
          open={alertOpen}
          primaryAction={removeJobSkill}
          primaryActionText={t('modals.job_skills.buttons.remove')}
          cancelAction={() => setAlertOpen(false)}
          cancelActionText={t('buttons.cancel')}
          message={
            <Trans i18nKey="modals.job_skills.messages.remove">
              Are you sure you want to remove{' '}
              <strong>{{ job_skill: skill?.name[locale] }}</strong> from your
              team?
            </Trans>
          }
        />
      )
    }

    const contextMenu = () => {
      return (
        <>
          <ContextMenu onOpenChange={handleContextMenuOpenChange}>
            <ContextMenuTrigger asChild>
              <Button
                leftAccessoryIcon={<EllipsisIcon />}
                className={buttonClasses}
                blended={true}
                onClick={handleButtonClicked}
              />
            </ContextMenuTrigger>
            <ContextMenuContent align="start">
              <ContextMenuItem onSelect={() => setAlertOpen(true)}>
                {t('context.remove_job_skill')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {removeAlert()}
        </>
      )
    }

    return (
      <div className={classes} ref={forwardedRef}>
        <div className={styles.info} onClick={props.onClick} tabIndex={0}>
          {skillImage()}
          {label()}
        </div>
        {skill && editable && contextMenu()}
      </div>
    )
  }
)

export default JobSkillItem
