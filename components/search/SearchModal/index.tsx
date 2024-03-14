import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'
import cloneDeep from 'lodash.clonedeep'

import api from '~utils/api'

import { Dialog, DialogTrigger, DialogClose } from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import Input from '~components/common/Input'
import CharacterSearchFilterBar from '~components/character/CharacterSearchFilterBar'
import WeaponSearchFilterBar from '~components/weapon/WeaponSearchFilterBar'
import SummonSearchFilterBar from '~components/summon/SummonSearchFilterBar'
import JobSkillSearchFilterBar from '~components/job/JobSkillSearchFilterBar'

import CharacterResult from '~components/character/CharacterResult'
import WeaponResult from '~components/weapon/WeaponResult'
import SummonResult from '~components/summon/SummonResult'
import JobSkillResult from '~components/job/JobSkillResult'
import GuidebookResult from '~components/extra/GuidebookResult'

import type { DialogProps } from '@radix-ui/react-dialog'
import type { SearchableObject, SearchableObjectArray } from '~types'

import styles from './index.module.scss'
import CrossIcon from '~public/icons/Cross.svg'
import classNames from 'classnames'
import useDidMountEffect from '~utils/useDidMountEffect'

interface Props extends DialogProps {
  send: (object: SearchableObject, position: number) => any
  placeholderText: string
  fromPosition: number
  job?: Job
  object: 'weapons' | 'characters' | 'summons' | 'job_skills' | 'guidebooks'
}

const SearchModal = (props: Props) => {
  // Set up router
  const router = useRouter()
  const locale = router.locale

  // Set up translation
  const { t } = useTranslation('common')

  // Refs
  const headerRef = React.createRef<HTMLDivElement>()
  const searchInput = React.createRef<HTMLInputElement>()
  const scrollContainer = React.createRef<HTMLDivElement>()

  const [firstLoad, setFirstLoad] = useState(true)
  const [filters, setFilters] = useState<{ [key: string]: any }>()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchableObjectArray>([])

  // Pagination states
  const [recordCount, setRecordCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentView, setCurrentView] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Classes
  const newestViewClasses = classNames({
    [styles.link]: true,
    [styles.active]: currentView === 0,
  })

  const recentViewClasses = classNames({
    [styles.link]: true,
    [styles.active]: currentView === 1,
  })

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus()
  }, [searchInput])

  useEffect(() => {
    if (props.open !== undefined) setOpen(props.open)
  })

  useDidMountEffect(() => {
    // Only show extra or subaura objects if invoked from those positions
    if (extraPositions().includes(props.fromPosition)) {
      if (props.object === 'weapons') {
        setFilters({
          extra: true,
          ...filters,
        })
      } else if (props.object === 'summons') {
        setFilters({
          subaura: true,
          ...filters,
        })
      }
    }
  }, [open])

  function inputChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    if (text.length) {
      setQuery(text)
    } else {
      setQuery('')
    }
  }

  function fetchResults({ replace = false }: { replace?: boolean }) {
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
        setTotalPages(response.data.meta.total_pages)
        setRecordCount(response.data.meta.count)

        if (replace) {
          replaceResults(response.data.meta.count, response.data.results)
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

    if (props.object === 'weapons') {
      recents = cloneDeep(cookieObj as Weapon[]) || []
      if (
        !recents.find(
          (item) =>
            (item as Weapon).granblue_id === (result as Weapon).granblue_id
        )
      ) {
        recents.unshift(result as Weapon)
      }
    } else if (props.object === 'summons') {
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

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    if (recents && recents.length > 5) recents.pop()
    setCookie(`recent_${props.object}`, recents, {
      path: '/',
      expires: expiresAt,
    })
    sendData(result)
  }

  function sendData(result: SearchableObject) {
    props.send(result, props.fromPosition)
    openChange()
  }

  const extraPositions = () => {
    if (props.object === 'weapons') return [9, 10, 11]
    else if (props.object === 'summons') return [4, 5]
    else return []
  }

  function receiveFilters(filters: { [key: string]: any }) {
    setCurrentPage(1)
    setResults([])

    // Only show extra or subaura objects if invoked from those positions
    if (extraPositions().includes(props.fromPosition)) {
      if (props.object === 'weapons') {
        setFilters({
          extra: true,
          ...filters,
        })
      } else if (props.object === 'summons') {
        setFilters({
          subaura: true,
          ...filters,
        })
      }
    }

    setFilters(filters)
  }

  useEffect(() => {
    // Current page changed
    if (open && currentPage > 1) {
      fetchResults({ replace: false })
    } else if (open && currentPage == 1) {
      fetchResults({ replace: true })
    }
  }, [open, currentPage])

  useEffect(() => {
    // Query changed
    if (open && query.length != 1) {
      setCurrentPage(1)
      fetchResults({ replace: true })
    }
  }, [query])

  useEffect(() => {
    if (open && props.object === 'guidebooks') {
      setCurrentPage(1)
      fetchResults({ replace: true })
    }
  }, [query, open])

  useEffect(() => {
    if (open) {
      setCurrentPage(1)
      fetchResults({ replace: true })
    }
  }, [filters, open])

  function incrementPage() {
    setCurrentPage(currentPage + 1)
  }

  function showNewest() {
    if (currentView !== 0) {
      setCurrentView(0)

      setCurrentPage(1)
      fetchResults({ replace: true })
    }
  }

  function showRecent() {
    if (currentView !== 1) {
      setCurrentView(1)

      // Fetch recently used items
      const key = `recent_${props.object}`
      const cookie = getCookie(key)
      const cookieObj: Weapon[] | Summon[] | Character[] = cookie
        ? JSON.parse(cookie as string)
        : []

      // Set the view
      setResults(cookieObj)
      setRecordCount(cookieObj.length)
      setFirstLoad(false)
    }
  }

  function renderResults() {
    let jsx

    switch (props.object) {
      case 'weapons':
        jsx = renderWeaponSearchResults()
        break
      case 'summons':
        jsx = renderSummonSearchResults(results)
        break
      case 'characters':
        jsx = renderCharacterSearchResults(results)
        break
      case 'job_skills':
        jsx = renderJobSkillSearchResults(results)
        break
      case 'guidebooks':
        jsx = renderGuidebookSearchResults(results)
        break
    }

    return (
      <InfiniteScroll
        dataLength={results && results.length > 0 ? results.length : 0}
        next={incrementPage}
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

  function renderGuidebookSearchResults(results: { [key: string]: any }) {
    let jsx: React.ReactNode

    const castResults: Guidebook[] = results as Guidebook[]
    if (castResults && Object.keys(castResults).length > 0) {
      jsx = castResults.map((result: Guidebook) => {
        return (
          <GuidebookResult
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
      setQuery('')
      setFirstLoad(true)
      setResults([])
      setRecordCount(0)
      setCurrentPage(1)
      setOpen(false)
      if (props.onOpenChange) props.onOpenChange(false)
    } else {
      setOpen(true)
      if (props.onOpenChange) props.onOpenChange(true)
    }
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault()
    openChange()
  }

  function onOpenAutoFocus(event: Event) {
    event.preventDefault()
    if (searchInput.current) searchInput.current.focus()
  }

  const filterBar = () => {
    if (props.object === 'characters') {
      return <CharacterSearchFilterBar sendFilters={receiveFilters} />
    } else if (props.object === 'weapons') {
      return <WeaponSearchFilterBar sendFilters={receiveFilters} />
    } else if (props.object === 'summons') {
      return <SummonSearchFilterBar sendFilters={receiveFilters} />
    } else if (props.object === 'job_skills') {
      return <JobSkillSearchFilterBar sendFilters={receiveFilters} />
    }
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        className="search"
        headerRef={headerRef}
        scrollable={false}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <header className={styles.header} ref={headerRef}>
          <div className={styles.searchBar}>
            <Input
              bound={true}
              fieldsetClassName="full"
              autoComplete="off"
              name="query"
              placeholder={props.placeholderText}
              ref={searchInput}
              value={query}
              onChange={inputChanged}
            />
            <DialogClose className={styles.close} onClick={openChange}>
              <CrossIcon />
            </DialogClose>
          </div>
          {filterBar()}
        </header>

        <div id="Results" className={styles.results} ref={scrollContainer}>
          <div className={styles.totalRow}>
            <h5 className={styles.total}>
              {t('search.result_count', { record_count: recordCount })}
            </h5>
            {(props.object === 'weapons' || props.object === 'summons') && (
              <div className={styles.viewSwitcher}>
                <span>{t('search.labels.view')}</span>
                <button className={newestViewClasses} onClick={showNewest}>
                  {t('search.labels.newest')}
                </button>
                <button className={recentViewClasses} onClick={showRecent}>
                  {t('search.labels.recently_used')}
                </button>
              </div>
            )}
          </div>
          {open && renderResults()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchModal
