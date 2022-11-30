import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useTranslation } from "react-i18next"

import { skillGroups } from "~utils/skillGroups"

import "./index.scss"

interface Props {
  sendFilters: (filters: { [key: string]: number }) => void
}

const JobSkillSearchFilterBar = (props: Props) => {
  // Set up translation
  const { t } = useTranslation("common")

  const [currentGroup, setCurrentGroup] = useState(-1)

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setCurrentGroup(parseInt(event.target.value))
  }

  function onBlur(event: React.ChangeEvent<HTMLSelectElement>) {}

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
      <select
        key="job-skill-groups"
        value={currentGroup}
        onBlur={onBlur}
        onChange={onChange}
      >
        <option key="all" value={-1}>
          {t(`job_skills.all`)}
        </option>
        <option key="damaging" value={2}>
          {t(`job_skills.damaging`)}
        </option>
        <option key="buffing" value={0}>
          {t(`job_skills.buffing`)}
        </option>
        <option key="debuffing" value={1}>
          {t(`job_skills.debuffing`)}
        </option>
        <option key="healing" value={3}>
          {t(`job_skills.healing`)}
        </option>
        <option key="emp" value={4}>
          {t(`job_skills.emp`)}
        </option>
        <option key="base" value={5}>
          {t(`job_skills.base`)}
        </option>
      </select>
    </div>
  )
}

export default JobSkillSearchFilterBar
