import React, { useEffect, useState } from "react"
import { useSnapshot } from "valtio"

import JobDropdown from "~components/JobDropdown"
import JobSkillItem from "~components/JobSkillItem"

import { appState } from "~utils/appState"

import "./index.scss"

// Props
interface Props {}

const JobSection = (props: Props) => {
  const [job, setJob] = useState<Job>()
  const [imageUrl, setImageUrl] = useState("")

  const { party } = useSnapshot(appState)

  const [numSkills, setNumSkills] = useState(4)
  const [skills, setSkills] = useState<JobSkill[]>([])

  useEffect(() => {
    // Set current job based on ID
    setJob(party.job)
  }, [])

  useEffect(() => {
    generateImageUrl()
  })

  useEffect(() => {
    if (job) appState.party.job = job
  }, [job])

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
            <li>
              <JobSkillItem skill={skills[i]} editable={!skills[i]?.main} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default JobSection
