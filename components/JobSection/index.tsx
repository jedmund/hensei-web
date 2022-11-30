import React, { ForwardedRef, useEffect, useState } from "react"
import { useTranslation } from "next-i18next"
import { useSnapshot } from "valtio"

import JobDropdown from "~components/JobDropdown"
import JobSkillItem from "~components/JobSkillItem"
import SearchModal from "~components/SearchModal"

import { appState } from "~utils/appState"

import type { SearchableObject } from "~types"

import "./index.scss"

// Props
interface Props {
  editable: boolean
}

const JobSection = (props: Props) => {
  const { t } = useTranslation("common")

  const [job, setJob] = useState<Job>()
  const [imageUrl, setImageUrl] = useState("")

  const { party } = useSnapshot(appState)

  const [numSkills, setNumSkills] = useState(4)
  const [skills, setSkills] = useState<JobSkill[]>([])

  const [skillRefs, setSkillRefs] = useState<ForwardedRef<HTMLDivElement>[]>([])

  useEffect(() => {
    // Set current job based on ID
    if (party.job) setJob(party.job)
  }, [])

  useEffect(() => {
    generateImageUrl()
  })

  useEffect(() => {
    if (job) appState.party.job = job
  }, [job])

  useEffect(() => {
    setSkillRefs(Array(numSkills).fill(React.createRef<HTMLDivElement>()))
  }, [numSkills])

  useEffect(() => {
    console.log(skillRefs)
  }, [skillRefs])

  function receiveJob(job?: Job) {
    console.log(`Receiving job! Row ${job?.row}: ${job?.name.en}`)
    if (job) {
      setJob(job)

      const baseSkills = appState.jobSkills.filter(
        (skill) => skill.job.id === job.id && skill.main
      )

      if (job.row === "1") setNumSkills(3)
      else setNumSkills(4)

      setSkills(baseSkills)
    }
  }

  function generateImageUrl() {
    let imgSrc = ""

    if (job) {
      const slug = job?.name.en.replaceAll(" ", "-").toLowerCase()
      const gender = party.user && party.user.gender == 1 ? "b" : "a"

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/jobs/${slug}_${gender}.png`
    }

    setImageUrl(imgSrc)
  }

  const skillItem = (index: number, editable: boolean) => {
    return (
      <JobSkillItem
        skill={skills[index]}
        editable={!skills[index]?.main && editable}
        key={`skill-${index}`}
        hasJob={job != undefined && job.id != "-1"}
        ref={skillRefs[index]}
      />
    )
  }

  const editableSkillItem = (index: number) => {
    return (
      <SearchModal
        placeholderText={t("search.placeholders.job_skill")}
        fromPosition={index}
        object="job_skills"
        job={job}
        send={updateObject}
      >
        {skillItem(index, true)}
      </SearchModal>
    )
  }

  function updateObject(object: SearchableObject, position: number) {}

  // Render: JSX components
  return (
    <section id="Job">
      <div className="JobImage">
        <img src={imageUrl} />
        <div className="Overlay" />
      </div>
      <div className="JobDetails">
        <JobDropdown
          currentJob={party.job ? party.job.id : undefined}
          onChange={receiveJob}
        />
        <ul className="JobSkills">
          {[...Array(numSkills)].map((e, i) => (
            <li key={`job-${i}`}>
              {job && job.id != "-1" && !skills[i]?.main && props.editable
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
