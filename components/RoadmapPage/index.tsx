import React from 'react'
import Link from 'next/link'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import ShareIcon from '~public/icons/Share.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

const ROADMAP_ITEMS = 6

const RoadmapPage = () => {
  const { t: common } = useTranslation('common')
  const { t: about } = useTranslation('about')

  return (
    <div className="Roadmap PageContent">
      <h1>{common('about.segmented_control.roadmap')}</h1>
      <section className="notes">
        <p>{about('roadmap.blurb')}</p>
        <p>{about('roadmap.link.intro')}</p>
        <div className="Github LinkItem">
          <Link href="https://github.com/users/jedmund/projects/1/views/3">
            <a
              href="https://github.com/users/jedmund/projects/1/views/3"
              target="_blank"
              rel="noreferrer"
            >
              <div className="Left">
                <GithubIcon />
                <h3>{about('roadmap.link.title')}</h3>
              </div>
              <ShareIcon className="ShareIcon" />
            </a>
          </Link>
        </div>
      </section>

      <section className="features">
        <h3 className="priority in_progress">{about('roadmap.subtitle')}</h3>
        <ul>
          {[...Array(ROADMAP_ITEMS)].map((e, i) => (
            <li key={`roadmap-${i}`}>
              <h4>{about(`roadmap.items.${i}.title`)}</h4>
              <p>{about(`roadmap.items.${i}.description`)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default RoadmapPage
