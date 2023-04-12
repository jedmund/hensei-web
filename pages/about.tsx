import React, { useEffect, useState } from 'react'
import Head from 'next/head'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { AboutTabs } from '~utils/enums'
import { setHeaders } from '~utils/userToken'

import AboutHead from '~components/about/AboutHead'
import AboutPage from '~components/about/AboutPage'
import UpdatesPage from '~components/about/UpdatesPage'
import RoadmapPage from '~components/about/RoadmapPage'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'

import type { NextApiRequest, NextApiResponse } from 'next'

interface Props {
  page?: string
}

const AboutRoute: React.FC<Props> = (props: Props) => {
  // Set up router
  const router = useRouter()

  // Import translations
  const { t } = useTranslation('common')

  const [currentTab, setCurrentTab] = useState<AboutTabs>(AboutTabs.About)
  const [currentPage, setCurrentPage] = useState('')

  useEffect(() => {
    const parts = router.asPath.split('/')
    const tab = parts[parts.length - 1]

    switch (tab) {
      case 'about':
        setCurrentTab(AboutTabs.About)
        setCurrentPage(parts[1])
        break
      case 'updates':
        setCurrentTab(AboutTabs.Updates)
        setCurrentPage(parts[1])
        break
      case 'roadmap':
        setCurrentTab(AboutTabs.Roadmap)
        setCurrentPage(parts[1])
        break
    }
  }, [router.asPath])

  useEffect(() => {
    if (props.page && ['about', 'updates', 'roadmap'].includes(props.page)) {
      setCurrentPage(props.page)
    }
  }, [props.page])

  function handleTabClicked(event: React.ChangeEvent<HTMLInputElement>) {
    const parts = router.asPath.split('/')
    const path = `/${event.target.value}`

    switch (event.target.value) {
      case 'about':
        router.replace(path)
        setCurrentTab(AboutTabs.About)
        setCurrentPage(parts[1])
        break
      case 'updates':
        router.replace(path)
        setCurrentTab(AboutTabs.Updates)
        setCurrentPage(parts[1])
        break
      case 'roadmap':
        router.replace(path)
        setCurrentTab(AboutTabs.Roadmap)
        setCurrentPage(parts[1])
        break
      default:
        break
    }
  }

  const currentSection = () => {
    switch (currentTab) {
      case AboutTabs.About:
        return <AboutPage />
      case AboutTabs.Updates:
        return <UpdatesPage />
      case AboutTabs.Roadmap:
        return <RoadmapPage />
    }
  }

  function pageHead() {
    return <AboutHead page={currentPage} />
  }

  return (
    <div id="About">
      {pageHead()}
      <section>
        <SegmentedControl>
          <Segment
            groupName="about"
            name="about"
            selected={currentTab == AboutTabs.About}
            onClick={handleTabClicked}
          >
            {t('about.segmented_control.about')}
          </Segment>
          <Segment
            groupName="about"
            name="updates"
            selected={currentTab == AboutTabs.Updates}
            onClick={handleTabClicked}
          >
            {t('about.segmented_control.updates')}
          </Segment>
          <Segment
            groupName="about"
            name="roadmap"
            selected={currentTab == AboutTabs.Roadmap}
            onClick={handleTabClicked}
          >
            {t('about.segmented_control.roadmap')}
          </Segment>
        </SegmentedControl>
        {currentSection()}
      </section>
    </div>
  )
}

export const getServerSidePaths = async () => {
  return {
    paths: [],
    fallback: true,
  }
}

// prettier-ignore
export const getServerSideProps = async ({ req, res, locale, query }: { req: NextApiRequest, res: NextApiResponse, locale: string, query: { [index: string]: string } }) => {
  // Set headers for server-side requests
  setHeaders(req, res)

  return {
    props: {
      page: req.url?.slice(1),
      ...(await serverSideTranslations(locale, ['common', 'about', 'updates'])),
      // Will be passed to the page component as props
    },
  }
}

export default AboutRoute
