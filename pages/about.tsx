import React, { useEffect, useState } from 'react'
import Head from 'next/head'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { AboutTabs } from '~utils/enums'
import { setHeaders } from '~utils/userToken'

import AboutPage from '~components/AboutPage'
import UpdatesPage from '~components/UpdatesPage'
import RoadmapPage from '~components/RoadmapPage'
import SegmentedControl from '~components/SegmentedControl'
import Segment from '~components/Segment'

import type { NextApiRequest, NextApiResponse } from 'next'

interface Props {}

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

  return (
    <div id="About">
      <Head>
        {/* HTML */}
        <title>{t(`page.titles.${currentPage}`)}</title>
        <meta
          name="description"
          content={t(`page.descriptions.${currentPage}`)}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* OpenGraph */}
        <meta property="og:title" content={t(`page.titles.${currentPage}`)} />
        <meta
          property="og:description"
          content={t('page.descriptions.about')}
        />
        <meta
          property="og:url"
          content={`https://app.granblue.team/${currentPage}`}
        />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="app.granblue.team" />
        <meta name="twitter:title" content={t(`page.titles.${currentPage}`)} />
        <meta
          name="twitter:description"
          content={t(`page.descriptions.${currentPage}`)}
        />
      </Head>

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

  // Fetch and organize raids
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'about', 'updates'])),
      // Will be passed to the page component as props
    },
  }
}

export default AboutRoute
