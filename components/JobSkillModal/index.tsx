import React, { useEffect, useState } from "react"
import { getCookie, setCookie } from "cookies-next"
import { useRouter } from "next/router"
import { useSnapshot } from "valtio"
import { useTranslation } from "react-i18next"
import InfiniteScroll from "react-infinite-scroll-component"

import { appState } from "~utils/appState"
import { skillGroups } from "~utils/skillGroups"

import * as Dialog from "@radix-ui/react-dialog"
import JobSkillResult from "~components/JobSkillResult"

import CrossIcon from "~public/icons/Cross.svg"

import "./index.scss"

interface Props {
  send: (skill: JobSkill, position: number) => any
  job?: Job
  fromPosition: number
  children: React.ReactNode
}

const JobSkillModal = (props: Props) => {
  // Set up router
  const router = useRouter()
  const locale = router.locale

  // Set up translation
  const { t } = useTranslation("common")

  let searchInput = React.createRef<HTMLInputElement>()
  let scrollContainer = React.createRef<HTMLDivElement>()

  const [currentGroup, setCurrentGroup] = useState(-1)
  const [currentGroupName, setCurrentGroupName] = useState("")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<JobSkill[]>([])

  // Pagination states
  const [recordCount, setRecordCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setResults(appState.jobSkills.filter((skill) => skill.main === false))
    setRecordCount(
      appState.jobSkills.filter((skill) => skill.main === false).length
    )
  }, [appState, setResults])

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus()
  }, [searchInput])

  useEffect(() => {
    setRecordCount(results.length)
  }, [results])

  useEffect(() => {
    const name = skillGroups
      .find((skill) => skill.id === currentGroup)
      ?.name["en"].toLowerCase()
    setCurrentGroupName(name ? name : "")
  }, [currentGroup])

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = parseInt(event.target.value)
    setCurrentGroup(newValue)

    if (newValue >= 0) {
      setResults(
        appState.jobSkills.filter((skill, i) => {
          if (newValue === 4) {
            return skill.emp && !skill.main
          } else if (newValue === 5) {
            return skill.base && !skill.main
          } else {
            return skill.color === newValue && !skill.main
          }
        })
      )
    } else {
      setResults(appState.jobSkills.filter((skill) => skill.main === false))
    }
  }

  function inputChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    if (text.length) {
      setQuery(text)
    } else {
      setQuery("")
    }
  }

  function openChange() {
    if (open) {
      setQuery("")
      // setFirstLoad(true)
      setResults([])
      setRecordCount(0)
      setCurrentPage(1)
      setOpen(false)
    } else {
      setOpen(true)
    }
  }

  function onBlur() {}

  function render() {
    const rows = results.map((result: JobSkill, i: number) => {
      return (
        <JobSkillResult data={result} key={`skill-${i}`} onClick={() => {}} />
      )
    })
    return (
      <InfiniteScroll
        dataLength={results && results.length > 0 ? results.length : 0}
        next={() => setCurrentPage(currentPage + 1)}
        hasMore={totalPages > currentPage}
        scrollableTarget="Results"
        loader={<div className="footer">Loading...</div>}
      >
        {rows}
      </InfiniteScroll>
    )
  }
  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Trigger asChild>{props.children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="Search Dialog">
          <div id="Header">
            <div id="Bar">
              <select
                key="job-skill-groups"
                value={currentGroup}
                onBlur={onBlur}
                onChange={onChange}
              >
                <option key="all" value={-1}>
                  All skills
                </option>
                <option key="damaging" value={2}>
                  Damaging
                </option>
                <option key="buffing" value={0}>
                  Buffing
                </option>
                <option key="debuffing" value={1}>
                  Debuffing
                </option>
                <option key="healing" value={3}>
                  Healing
                </option>
                <option key="emp" value={4}>
                  Extended Mastery
                </option>
                <option key="base" value={5}>
                  Base Skills
                </option>
              </select>
              <Dialog.Close className="DialogClose" onClick={openChange}>
                <CrossIcon />
              </Dialog.Close>
            </div>
            <label className="search_label" htmlFor="search_input">
              <input
                autoComplete="off"
                type="text"
                name="query"
                className="Input"
                id="search_input"
                ref={searchInput}
                value={query}
                placeholder={
                  currentGroupName
                    ? `Search for ${currentGroupName} skills...`
                    : `Search all skills...`
                }
                onChange={inputChanged}
              />
            </label>
          </div>

          <div id="Results" ref={scrollContainer}>
            <h5 className="total">
              {t("search.result_count", { record_count: recordCount })}
            </h5>
            {open ? render() : ""}
          </div>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default JobSkillModal
