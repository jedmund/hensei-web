import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Select from '~components/common/Select'
import SelectItem from '~components/common/SelectItem'

import styles from './index.module.scss'

interface Props {
  sendFilters: (filters: { [key: string]: number }) => void
}

const JobSkillSearchFilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(-1)

  function openSelect() {
    // debugger
    setOpen(!open)
  }

  function onChange(value: string) {
    setCurrentGroup(parseInt(value))
  }

  function sendFilters() {
    const filters = {
      group: currentGroup,
    }

    props.sendFilters(filters)
  }

  useEffect(() => {
    sendFilters()
  }, [currentGroup])

  return (
    <div className={styles.filterBar}>
      <Select
        value={-1}
        trigger={{
          bound: true,
          className: 'full',
        }}
        open={open}
        overlayVisible={false}
        onValueChange={onChange}
        onOpenChange={openSelect}
      >
        <SelectItem key="all" value={-1}>
          {t(`job_skills.all`)}
        </SelectItem>
        <SelectItem key="damaging" value={2}>
          {t(`job_skills.damaging`)}
        </SelectItem>
        <SelectItem key="buffing" value={0}>
          {t(`job_skills.buffing`)}
        </SelectItem>
        <SelectItem key="debuffing" value={1}>
          {t(`job_skills.debuffing`)}
        </SelectItem>
        <SelectItem key="healing" value={3}>
          {t(`job_skills.healing`)}
        </SelectItem>
        <SelectItem key="emp" value={4}>
          {t(`job_skills.emp`)}
        </SelectItem>
        <SelectItem key="base" value={5}>
          {t(`job_skills.base`)}
        </SelectItem>
      </Select>
    </div>
  )
}

export default JobSkillSearchFilterBar
