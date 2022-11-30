import React, { useEffect, useState } from "react"
import { getCookie, setCookie } from "cookies-next"
import { useRouter } from "next/router"
import { useSnapshot } from "valtio"
import { useTranslation } from "react-i18next"
import InfiniteScroll from "react-infinite-scroll-component"

import { appState } from "~utils/appState"
import api from "~utils/api"

import * as Dialog from "@radix-ui/react-dialog"

import CharacterSearchFilterBar from "~components/CharacterSearchFilterBar"
import WeaponSearchFilterBar from "~components/WeaponSearchFilterBar"
import SummonSearchFilterBar from "~components/SummonSearchFilterBar"
import JobSkillSearchFilterBar from "~components/JobSkillSearchFilterBar"

import CharacterResult from "~components/CharacterResult"
import WeaponResult from "~components/WeaponResult"
import SummonResult from "~components/SummonResult"
import JobSkillResult from "~components/JobSkillResult"

import type { SearchableObject, SearchableObjectArray } from "~types"

import "./index.scss"
import CrossIcon from "~public/icons/Cross.svg"
import cloneDeep from "lodash.clonedeep"

interface Props {
  send: (object: SearchableObject, position: number) => any
  placeholderText: string
  fromPosition: number
  job?: Job
  object: "weapons" | "characters" | "summons" | "job_skills"
  children: React.ReactNode
}

const SearchModal = (props: Props) => {
  // Set up router
  const router = useRouter()
  const locale = router.locale

  // Set up translation
  const { t } = useTranslation("common")

  let searchInput = React.createRef<HTMLInputElement>()
  let scrollContainer = React.createRef<HTMLDivElement>()

  const [firstLoad, setFirstLoad] = useState(true)
  const [filters, setFilters] = useState<{ [key: string]: any }>()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchableObjectArray>([])

  // Pagination states
  const [recordCount, setRecordCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus()
  }, [searchInput])

  function inputChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    if (text.length) {
      setQuery(text)
    } else {
      setQuery("")
    }
  }

  function fetchResults({ replace = false }: { replace?: boolean }) {
    console.log("Fetch results!!!")
    api
      .search({
        object: props.object,
        query: query,
        job: props.job?.id,
        filters: filters,
        locale: locale,
        page: currentPage,
      })
      .then((response) => {
        console.log("resp")
        console.log(response)
        setTotalPages(response.data.total_pages)
        setRecordCount(response.data.count)

        if (replace) {
          replaceResults(response.data.count, response.data.results)
        } else {
          appendResults(response.data.results)
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  function replaceResults(count: number, list: SearchableObjectArray) {
    if (count > 0) {
      setResults(list)
    } else {
      setResults([])
    }
  }

  function appendResults(list: SearchableObjectArray) {
    setResults([...results, ...list])
  }

  function storeRecentResult(result: SearchableObject) {
    const key = `recent_${props.object}`
    const cookie = getCookie(key)
    const cookieObj: SearchableObjectArray = cookie
      ? JSON.parse(cookie as string)
      : []
    let recents: SearchableObjectArray = []

    if (props.object === "weapons") {
      recents = cloneDeep(cookieObj as Weapon[]) || []
      if (
        !recents.find(
          (item) =>
            (item as Weapon).granblue_id === (result as Weapon).granblue_id
        )
      ) {
        recents.unshift(result as Weapon)
      }
    } else if (props.object === "summons") {
      recents = cloneDeep(cookieObj as Summon[]) || []
      if (
        !recents.find(
          (item) =>
            (item as Summon).granblue_id === (result as Summon).granblue_id
        )
      ) {
        recents.unshift(result as Summon)
      }
    }

    if (recents && recents.length > 5) recents.pop()
    setCookie(`recent_${props.object}`, recents, { path: "/" })
    sendData(result)
  }

  function sendData(result: SearchableObject) {
    props.send(result, props.fromPosition)
    openChange()
  }

  function receiveFilters(filters: { [key: string]: any }) {
    setCurrentPage(1)
    setResults([])
    setFilters(filters)
  }

  useEffect(() => {
    // Current page changed
    if (open && currentPage > 1) {
      fetchResults({ replace: false })
    } else if (open && currentPage == 1) {
      fetchResults({ replace: true })
    }
  }, [currentPage])

  useEffect(() => {
    // Filters changed
    const key = `recent_${props.object}`
    const cookie = getCookie(key)
    const cookieObj: Weapon[] | Summon[] | Character[] = cookie
      ? JSON.parse(cookie as string)
      : []

    if (open) {
      if (firstLoad && cookieObj && cookieObj.length > 0) {
        setResults(cookieObj)
        setRecordCount(cookieObj.length)
        setFirstLoad(false)
      } else {
        setCurrentPage(1)
        fetchResults({ replace: true })
      }
    }
  }, [filters])

  useEffect(() => {
    // Query changed
    if (open && query.length != 1) {
      setCurrentPage(1)
      fetchResults({ replace: true })
    }
  }, [query])

  function renderResults() {
    let jsx

    switch (props.object) {
      case "weapons":
        jsx = renderWeaponSearchResults()
        break
      case "summons":
        jsx = renderSummonSearchResults(results)
        break
      case "characters":
        jsx = renderCharacterSearchResults(results)
        break
      case "job_skills":
        jsx = renderJobSkillSearchResults(results)
        break
    }

    return (
      <InfiniteScroll
        dataLength={results && results.length > 0 ? results.length : 0}
        next={() => setCurrentPage(currentPage + 1)}
        hasMore={totalPages > currentPage}
        scrollableTarget="Results"
        loader={<div className="footer">Loading...</div>}
      >
        {jsx}
      </InfiniteScroll>
    )
  }

  function renderWeaponSearchResults() {
    let jsx: React.ReactNode

    const castResults: Weapon[] = results as Weapon[]
    if (castResults && Object.keys(castResults).length > 0) {
      jsx = castResults.map((result: Weapon) => {
        return (
          <WeaponResult
            key={result.id}
            data={result}
            onClick={() => {
              storeRecentResult(result)
            }}
          />
        )
      })
    }

    return jsx
  }

  function renderSummonSearchResults(results: { [key: string]: any }) {
    let jsx: React.ReactNode

    const castResults: Summon[] = results as Summon[]
    if (castResults && Object.keys(castResults).length > 0) {
      jsx = castResults.map((result: Summon) => {
        return (
          <SummonResult
            key={result.id}
            data={result}
            onClick={() => {
              storeRecentResult(result)
            }}
          />
        )
      })
    }

    return jsx
  }

  function renderCharacterSearchResults(results: { [key: string]: any }) {
    let jsx: React.ReactNode

    const castResults: Character[] = results as Character[]
    if (castResults && Object.keys(castResults).length > 0) {
      jsx = castResults.map((result: Character) => {
        return (
          <CharacterResult
            key={result.id}
            data={result}
            onClick={() => {
              storeRecentResult(result)
            }}
          />
        )
      })
    }

    return jsx
  }

  function renderJobSkillSearchResults(results: { [key: string]: any }) {
    let jsx: React.ReactNode

    const castResults: JobSkill[] = results as JobSkill[]
    if (castResults && Object.keys(castResults).length > 0) {
      jsx = castResults.map((result: JobSkill) => {
        return (
          <JobSkillResult
            key={result.id}
            data={result}
            onClick={() => {
              storeRecentResult(result)
            }}
          />
        )
      })
    }

    return jsx
  }

  function openChange() {
    if (open) {
      setQuery("")
      setFirstLoad(true)
      setResults([])
      setRecordCount(0)
      setCurrentPage(1)
      setOpen(false)
    } else {
      setOpen(true)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Trigger asChild>{props.children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="Search Dialog">
          <div id="Header">
            <div id="Bar">
              <label className="search_label" htmlFor="search_input">
                <input
                  autoComplete="off"
                  type="text"
                  name="query"
                  className="Input"
                  id="search_input"
                  ref={searchInput}
                  value={query}
                  placeholder={props.placeholderText}
                  onChange={inputChanged}
                />
              </label>
              <Dialog.Close className="DialogClose" onClick={openChange}>
                <CrossIcon />
              </Dialog.Close>
            </div>
            {props.object === "characters" ? (
              <CharacterSearchFilterBar sendFilters={receiveFilters} />
            ) : (
              ""
            )}
            {props.object === "weapons" ? (
              <WeaponSearchFilterBar sendFilters={receiveFilters} />
            ) : (
              ""
            )}
            {props.object === "summons" ? (
              <SummonSearchFilterBar sendFilters={receiveFilters} />
            ) : (
              ""
            )}
            {props.object === "job_skills" ? (
              <JobSkillSearchFilterBar sendFilters={receiveFilters} />
            ) : (
              ""
            )}
          </div>

          <div id="Results" ref={scrollContainer}>
            <h5 className="total">
              {t("search.result_count", { record_count: recordCount })}
            </h5>
            {open ? renderResults() : ""}
          </div>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default SearchModal
