import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import JobDropdown from '~components/JobDropdown'
import JobSkillItem from '~components/JobSkillItem'
import SearchModal from '~components/SearchModal'

import { appState } from '~utils/appState'
import type { JobSkillObject, SearchableObject } from '~types'

import './index.scss'

// Props
interface Props {
  job?: Job
  jobSkills: JobSkillObject
  editable: boolean
  saveJob: (job?: Job) => void
  saveSkill: (skill: JobSkill, position: number) => void
}

const JobSection = (props: Props) => {
  const { party } = useSnapshot(appState)
  const { t } = useTranslation('common')

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const [job, setJob] = useState<Job>()
  const [imageUrl, setImageUrl] = useState('')
  const [numSkills, setNumSkills] = useState(4)
  const [skills, setSkills] = useState<{ [key: number]: JobSkill | undefined }>(
    []
  )

  const selectRef = React.createRef<HTMLSelectElement>()

  useEffect(() => {
    // Set current job based on ID
    setJob(props.job)
    setSkills({
      0: props.jobSkills[0],
      1: props.jobSkills[1],
      2: props.jobSkills[2],
      3: props.jobSkills[3],
    })

    if (selectRef.current && props.job) selectRef.current.value = props.job.id
  }, [props])

  useEffect(() => {
    generateImageUrl()
  })

  useEffect(() => {
    if (job) {
      if ((party.job && job.id != party.job.id) || !party.job)
        appState.party.job = job
      if (job.row === '1') setNumSkills(3)
      else setNumSkills(4)
    }
  }, [job])

  function receiveJob(job?: Job) {
    setJob(job)
    props.saveJob(job)
  }

  function generateImageUrl() {
    let imgSrc = ''

    if (job) {
      const slug = job?.name.en.replaceAll(' ', '-').toLowerCase()
      const gender = party.user && party.user.gender == 1 ? 'b' : 'a'

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/jobs/${slug}_${gender}.png`
    }

    setImageUrl(imgSrc)
  }

  const canEditSkill = (skill?: JobSkill) => {
    // If there is a job and a skill present in the slot
    if (job) {
      // If the skill's job is one of the job's main skill
      if (skill && skill.job.id === job.id && skill.main) return false

      return props.editable
    } else return false
  }

  const skillItem = (index: number, editable: boolean) => {
    return (
      <JobSkillItem
        skill={skills[index]}
        editable={canEditSkill(skills[index])}
        key={`skill-${index}`}
        hasJob={job != undefined && job.id != '-1'}
      />
    )
  }

  const editableSkillItem = (index: number) => {
    return (
      <SearchModal
        placeholderText={t('search.placeholders.job_skill')}
        fromPosition={index}
        object="job_skills"
        job={job}
        send={saveJobSkill}
      >
        {skillItem(index, true)}
      </SearchModal>
    )
  }

  function saveJobSkill(object: SearchableObject, position: number) {
    const skill = object as JobSkill

    const newSkills = skills
    newSkills[position] = skill
    setSkills(newSkills)

    props.saveSkill(skill, position)
  }

  // Render: JSX components
  return (
    <section id="Job">
      <div className="JobImage">
        {party.job && party.job.id !== '-1' ? (
          <img alt={party.job.name[locale]} src={imageUrl} />
        ) : (
          ''
        )}
        <div className="Job Overlay" />
      </div>
      <div className="JobDetails">
        {props.editable ? (
          <JobDropdown
            currentJob={party.job?.id}
            onChange={receiveJob}
            ref={selectRef}
          />
        ) : (
          <div className="JobName">
            <img
              alt={party.job.name[locale]}
              src={`/images/job-icons/${party.job.granblue_id}.png`}
            />
            <h3>{party.job ? party.job.name[locale] : t('no_job')}</h3>
          </div>
        )}

        <ul className="JobSkills">
          {[...Array(numSkills)].map((e, i) => (
            <li key={`job-${i}`}>
              {canEditSkill(skills[i])
                ? editableSkillItem(i)
                : skillItem(i, false)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default JobSection
