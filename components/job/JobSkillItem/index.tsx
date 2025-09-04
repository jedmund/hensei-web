'use client'
import React, { useState } from 'react'
import { getCookie } from 'cookies-next'
import { useTranslations } from 'next-intl'
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
  small?: boolean
  hasJob: boolean
  removeJobSkill: (position: number) => void
}

const defaultProps = {
  small: false,
}

const JobSkillItem = React.forwardRef<HTMLDivElement, Props>(
  function useJobSkillItem(
    {
      skill,
      position,
      editable,
      small,
      hasJob,
      removeJobSkill: sendJobSkillToRemove,
      ...props
    },
    forwardedRef
  ) {
    // Set up translation
    const t = useTranslations('common')
    const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

    // States: Component
    const [alertOpen, setAlertOpen] = useState(false)
    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    // Classes
    const classes = classNames({
      [styles.skill]: true,
      [styles.editable]: editable,
      [styles.small]: small,
    })

    const imageClasses = classNames({
      [styles.placeholder]: !skill,
      [styles.image]: true,
      [styles.editable]: editable && hasJob,
    })

    const labelClasses = classNames({
      [styles.placeholder]: !skill,
      [styles.text]: true,
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

    // Methods: Rendering
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
        jsx = <p className={labelClasses}>{t('job_skills.state.selectable')}</p>
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
            <>
              {t.rich('modals.job_skills.messages.remove', {
                job_skill: skill?.name[locale] || '',
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </>
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

JobSkillItem.defaultProps = defaultProps

export default JobSkillItem
