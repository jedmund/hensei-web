'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '~/i18n/navigation'
import { AboutTabs } from '~/utils/enums'

import AboutPage from '~/components/about/AboutPage'
import UpdatesPage from '~/components/about/UpdatesPage'
import RoadmapPage from '~/components/about/RoadmapPage'
import SegmentedControl from '~/components/common/SegmentedControl'
import Segment from '~/components/common/Segment'

export default function AboutPageClient() {
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  
  const [currentTab, setCurrentTab] = useState<AboutTabs>(AboutTabs.About)
  
  useEffect(() => {
    const parts = pathname.split('/')
    const lastPart = parts[parts.length - 1]
    
    switch (lastPart) {
      case 'about':
        setCurrentTab(AboutTabs.About)
        break
      case 'updates':
        setCurrentTab(AboutTabs.Updates)
        break
      case 'roadmap':
        setCurrentTab(AboutTabs.Roadmap)
        break
      default:
        setCurrentTab(AboutTabs.About)
    }
  }, [pathname])
  
  function handleTabClicked(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    router.push(`/${value}`)
    
    switch (value) {
      case 'about':
        setCurrentTab(AboutTabs.About)
        break
      case 'updates':
        setCurrentTab(AboutTabs.Updates)
        break
      case 'roadmap':
        setCurrentTab(AboutTabs.Roadmap)
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