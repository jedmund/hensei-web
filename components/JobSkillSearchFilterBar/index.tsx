import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Select from '~components/Select'
import SelectItem from '~components/SelectItem'

import './index.scss'

interface Props {
  sendFilters: (filters: { [key: string]: number }) => void
}

const JobSkillSearchFilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation('common')

  const [open, setOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(-1)

  function openSelect() {
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
    <div className="SearchFilterBar">
      <Select
        value={-1}
        triggerClass="Bound"
        trigger={'All elements'}
        open={open}
        onValueChange={onChange}
        onClick={openSelect}
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
