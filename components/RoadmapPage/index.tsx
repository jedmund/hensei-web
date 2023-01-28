import React from 'react'
import Link from 'next/link'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import ShareIcon from '~public/icons/Share.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

interface Props {}

const RoadmapPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')
  const { t: roadmap } = useTranslation('roadmap')
  return (
    <div className="Roadmap PageContent">
      <h1>{common('about.segmented_control.roadmap')}</h1>
      <section className="notes">
        <p>{roadmap('blurb')}</p>
        <p>{roadmap('link.intro')}</p>
        <div className="LinkItem">
          <Link href="https://github.com/users/jedmund/projects/1/views/3">
            <a
              href="https://github.com/users/jedmund/projects/1/views/3"
              target="_blank"
              rel="noreferrer"
            >
              <div className="Left">
                <GithubIcon />
                <h3>{roadmap('link.title')}</h3>
              </div>
              <ShareIcon className="ShareIcon" />
            </a>
          </Link>
        </div>
      </section>

      <section className="features">
        <h3 className="priority in_progress">{roadmap('subtitle')}</h3>
        <ul>
          <li>
            <h4>{roadmap('roadmap.item1.title')}</h4>
            <p>{roadmap('roadmap.item1.description')}</p>
          </li>
          <li>
            <h4>{roadmap('roadmap.item2.title')}</h4>
            <p>{roadmap('roadmap.item2.description')}</p>
          </li>
          <li>
            <h4>{roadmap('roadmap.item3.title')}</h4>
            <p>{roadmap('roadmap.item3.description')}</p>
          </li>
          <li>
            <h4>{roadmap('roadmap.item4.title')}</h4>
            <p>{roadmap('roadmap.item4.description')}</p>
          </li>
          <li>
            <h4>{roadmap('roadmap.item5.title')}</h4>
            <p>{roadmap('roadmap.item5.description')}</p>
          </li>
          <li>
            <h4>{roadmap('roadmap.item6.title')}</h4>
            <p>{roadmap('roadmap.item6.description')}</p>
          </li>
        </ul>
      </section>
    </div>
  )
}

export default RoadmapPage
