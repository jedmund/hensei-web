import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { SkillGroup, skillClassification } from '~data/skillGroups'

import './index.scss'

interface Props {
  data: JobSkill
  onClick: () => void
}

const JobSkillResult = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const skill = props.data

  const [group, setGroup] = useState<SkillGroup | undefined>()

  useEffect(() => {
    setGroup(skillClassification.find((group) => group.id === skill.color))
  }, [skill, setGroup, skillClassification])

  const jobSkillUrl = () =>
    `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-skills/${skill.slug}.png`

  return (
    <li className="JobSkillResult" onClick={props.onClick}>
      <img alt={skill.name[locale]} src={jobSkillUrl()} />
      <div className="Info">
        <h5>{skill.name[locale]}</h5>
        <div className={`skill pill ${group?.name['en'].toLowerCase()}`}>
          {group?.name[locale]}
        </div>
      </div>
    </li>
  )
}

export default JobSkillResult
