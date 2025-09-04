'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '~/i18n/navigation'
import { AboutTabs } from '~/utils/enums'

import AboutPage from '~/components/about/AboutPage'
import UpdatesPage from '~/components/about/UpdatesPage'
import RoadmapPage from '~/components/about/RoadmapPage'
import SegmentedControl from '~/components/common/SegmentedControl'
import Segment from '~/components/common/Segment'

export default function RoadmapPageClient() {
  const t = useTranslations('common')
  const router = useRouter()
  const [currentTab] = useState<AboutTabs>(AboutTabs.Roadmap)
  
  function handleTabClicked(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    router.push(`/${value}`)
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
    <section>
      <SegmentedControl blended={true}>
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
  )
}