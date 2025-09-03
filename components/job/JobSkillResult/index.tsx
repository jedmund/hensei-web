'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import classNames from 'classnames'
import { SkillGroup, skillClassification } from '~data/skillGroups'

import styles from './index.module.scss'

interface Props {
  data: JobSkill
  onClick: () => void
}

const JobSkillResult = (props: Props) => {
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  const skill = props.data

  const [group, setGroup] = useState<SkillGroup | undefined>()

  useEffect(() => {
    setGroup(skillClassification.find((group) => group.id === skill.color))
  }, [skill, setGroup, skillClassification])

  const classes = classNames({
    [styles.skill]: true,
    [styles.pill]: true,
    [styles[`${group?.name['en'].toLowerCase()}`]]: true,
  })

  const jobSkillUrl = () =>
    `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-skills/${skill.slug}.png`

  return (
    <li className={styles.result} onClick={props.onClick}>
      <img alt={skill.name[locale]} src={jobSkillUrl()} />
      <div className={styles.info}>
        <h5>{skill.name[locale]}</h5>
        <div className={classes}>{group?.name[locale]}</div>
      </div>
    </li>
  )
}

export default JobSkillResult
