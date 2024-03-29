import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import JobDropdown from '~components/job/JobDropdown'
import JobImage from '~components/job/JobImage'
import JobSkillItem from '~components/job/JobSkillItem'
import SearchModal from '~components/search/SearchModal'

import api from '~utils/api'
import { appState } from '~utils/appState'
import type { JobSkillObject, SearchableObject } from '~types'

import styles from './index.module.scss'

// Props
interface Props {
  job?: Job
  jobSkills: JobSkillObject
  jobAccessory?: JobAccessory
  editable: boolean
  saveJob: (job?: Job) => void
  saveSkill: (skill: JobSkill, position: number) => void
  removeSkill: (position: number) => void
  saveAccessory: (accessory: JobAccessory) => void
}

const JobSection = (props: Props) => {
  const { party } = useSnapshot(appState)
  const { t } = useTranslation('common')

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Data state
  const [job, setJob] = useState<Job>()
  const [imageUrl, setImageUrl] = useState('')
  const [numSkills, setNumSkills] = useState(4)
  const [skills, setSkills] = useState<{ [key: number]: JobSkill | undefined }>(
    []
  )
  const [accessories, setAccessories] = useState<JobAccessory[]>([])
  const [currentAccessory, setCurrentAccessory] = useState<
    JobAccessory | undefined
  >()

  // Refs
  const selectRef = React.createRef<HTMLSelectElement>()

  // Classes
  const skillContainerClasses = classNames({
    [styles.skills]: true,
    [styles.editable]: props.editable,
  })

  useEffect(() => {
    // Set current job based on ID
    setJob(props.job)
    setSkills({
      0: props.jobSkills[0],
      1: props.jobSkills[1],
      2: props.jobSkills[2],
      3: props.jobSkills[3],
    })
    setCurrentAccessory(props.jobAccessory)

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
      fetchJobAccessories()
    }
  }, [job])

  // Data fetching
  async function fetchJobAccessories() {
    if (job && job.accessory) {
      const response = await api.jobAccessoriesForJob(job.id)
      const jobAccessories: JobAccessory[] = response.data
      setAccessories(jobAccessories)
    }
  }

  function receiveJob(job?: Job) {
    setJob(job)
    props.saveJob(job)
  }

  function handleAccessorySelected(value: string) {
    const accessory = accessories.find((accessory) => accessory.id === value)

    if (accessory) {
      setCurrentAccessory(accessory)
      props.saveAccessory(accessory)
    }
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
    if (job && job.id !== '-1') {
      // If the skill's job is one of the job's main skill
      if (skill && skill.job.id === job.id && skill.main) return false

      return props.editable
    } else return false
  }

  const skillItem = (index: number, editable: boolean) => {
    return (
      <JobSkillItem
        skill={skills[index]}
        position={index}
        editable={canEditSkill(skills[index])}
        small={props.editable}
        key={`skill-${index}`}
        hasJob={job != undefined && job.id != '-1'}
        removeJobSkill={props.removeSkill}
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

  const emptyJobLabel = (
    <div className="JobName">
      <h3>{t('no_job')}</h3>
    </div>
  )

  const filledJobLabel = (
    <div className={styles.name}>
      <img
        alt={job?.name[locale]}
        src={`/images/job-icons/${job?.granblue_id}.png`}
      />
      <h3>{job?.name[locale]}</h3>
    </div>
  )

  const renderJobDropdown = () => {
    if (props.editable) {
      return (
        <JobDropdown
          currentJob={party.job?.id}
          onChange={receiveJob}
          ref={selectRef}
        />
      )
    } else {
      return (
        <div className={styles.name}>
          {party.job && (
            <img
              alt={party.job.name[locale]}
              src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-icons/${party.job.granblue_id}.png`}
            />
          )}
          <h3>{party.job ? party.job.name[locale] : t('no_job')}</h3>
        </div>
      )
    }
  }

  // Render: JSX components
  return (
    <section className={styles.job}>
      <JobImage
        job={party.job}
        currentAccessory={currentAccessory}
        accessories={accessories}
        editable={props.editable}
        user={party.user}
        onAccessorySelected={handleAccessorySelected}
      />
      <div className={styles.details}>
        {renderJobDropdown()}

        <ul className={skillContainerClasses}>
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
