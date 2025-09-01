'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import Select from '~components/common/Select'
import SelectItem from '~components/common/SelectItem'
import SelectGroup from '~components/common/SelectGroup'

import { appState } from '~utils/appState'
import { jobGroups } from '~data/jobGroups'

// Props
interface Props {
  currentJob?: string
  onChange?: (job?: Job) => void
  onBlur?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

type GroupedJob = { [key: string]: Job[] }

const JobDropdown = React.forwardRef<HTMLSelectElement, Props>(
  function useFieldSet(props, ref) {
    // Set up locale from cookie
    const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

    // Set up translation
    const { t } = useTranslation('common')

    // Create snapshot of app state
    const { party } = useSnapshot(appState)

    // Set up local states for storing jobs
    const [open, setOpen] = useState(false)
    const [currentJob, setCurrentJob] = useState<Job>()
    const [jobs, setJobs] = useState<Job[]>()
    const [sortedJobs, setSortedJobs] = useState<GroupedJob>()

    // Set current job from state on mount
    useEffect(() => {
      if (party.job?.id !== '-1') {
        setCurrentJob(party.job)
      }
    }, [])

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

    function openJobSelect() {
      setOpen(!open)
    }

    // Enable changing select value
    function handleChange(value: string) {
      if (jobs) {
        const job = jobs.find((job) => job.id === value)
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
              <SelectItem
                key={i}
                value={item.id}
                icon={{
                  alt: item.name[locale],
                  src: [
                    `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-icons/${item.granblue_id}.png`,
                  ],
                }}
              >
                {item.name[locale]}
              </SelectItem>
            )
          })

      const groupName = jobGroups.find((g) => g.slug === group)?.name[locale]

      return (
        <SelectGroup key={group} label={groupName} separator={false}>
          {options}
        </SelectGroup>
      )
    }

    return (
      <Select
        value={currentJob ? currentJob.id : 'no-job'}
        icon={{
          alt: currentJob ? currentJob.name[locale] : '',
          src: currentJob
            ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-icons/${currentJob.granblue_id}.png`
            : '',
        }}
        open={open}
        onClick={openJobSelect}
        onOpenChange={() => setOpen(!open)}
        onValueChange={handleChange}
        className="job"
        trigger={{
          className: 'job',
        }}
        overlayVisible={false}
      >
        <SelectItem key={-1} value="no-job">
          {t('no_job')}
        </SelectItem>
        {sortedJobs
          ? Object.keys(sortedJobs)
              .sort((a, b) => ('' + a).localeCompare(b))
              .map((x) => renderJobGroup(x))
          : ''}
      </Select>
    )
  }
)

export default JobDropdown
