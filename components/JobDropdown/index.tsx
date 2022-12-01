import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"

import { appState } from "~utils/appState"
import { jobGroups } from "~utils/jobGroups"

import "./index.scss"

// Props
interface Props {
  currentJob?: string
  onChange?: (job?: Job) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

type GroupedJob = { [key: string]: Job[] }

const JobDropdown = React.forwardRef<HTMLSelectElement, Props>(
  function useFieldSet(props, ref) {
    // Set up router for locale
    const router = useRouter()
    const locale = router.locale || "en"

    // Set up local states for storing jobs
    const [currentJob, setCurrentJob] = useState<Job>()
    const [jobs, setJobs] = useState<Job[]>()
    const [sortedJobs, setSortedJobs] = useState<GroupedJob>()

    // Organize jobs into groups on mount
    useEffect(() => {
      const jobGroups = appState.jobs
        .map((job) => job.row)
        .filter((value, index, self) => self.indexOf(value) === index)
      let groupedJobs: GroupedJob = {}

      jobGroups.forEach((group) => {
        groupedJobs[group] = appState.jobs.filter((job) => job.row === group)
      })

      setJobs(appState.jobs)
      setSortedJobs(groupedJobs)
    }, [appState])

    // Set current job on mount
    useEffect(() => {
      if (jobs && props.currentJob) {
        const job = appState.jobs.find((job) => job.id === props.currentJob)
        setCurrentJob(job)
      }
    }, [appState, props.currentJob])

    // Enable changing select value
    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
      if (jobs) {
        const job = jobs.find((job) => job.id === event.target.value)
        if (props.onChange) props.onChange(job)
        setCurrentJob(job)
      }
    }

    // Render JSX for each job option, sorted into optgroups
    function renderJobGroup(group: string) {
      const options =
        sortedJobs &&
        sortedJobs[group].length > 0 &&
        sortedJobs[group]
          .sort((a, b) => a.order - b.order)
          .map((item, i) => {
            return (
              <option
                key={i}
                value={item.id}
                selected={item.id === props.currentJob}
              >
                {item.name[locale]}
              </option>
            )
          })

      const groupName = jobGroups.find((g) => g.slug === group)?.name[locale]

      return (
        <optgroup key={group} label={groupName}>
          {options}
        </optgroup>
      )
    }

    return (
      <select
        key={currentJob?.id}
        value={currentJob?.id}
        onBlur={props.onBlur}
        onChange={handleChange}
        ref={ref}
      >
        <option key="no-job" value={-1}>
          No class
        </option>
        {sortedJobs
          ? Object.keys(sortedJobs).map((x) => renderJobGroup(x))
          : ""}
      </select>
    )
  }
)

export default JobDropdown
